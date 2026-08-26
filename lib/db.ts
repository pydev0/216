import { createClient, type Client } from "@libsql/client";

const SEED_USERS: { name: string; role: "admin" | "user" }[] = [
  { name: "Kane", role: "admin" },
  { name: "Hemanth", role: "admin" },
  { name: "Natasha", role: "user" },
  { name: "Rajini", role: "user" },
  { name: "Nidhin", role: "user" },
  { name: "Anish", role: "user" },
  { name: "Kamal", role: "user" },
  { name: "Bibin", role: "user" },
  { name: "Drew", role: "user" },
  { name: "Debbie", role: "user" },
  { name: "Nikki", role: "user" },
  { name: "Lavinya", role: "user" },
  { name: "Octavian", role: "user" },
  { name: "Ionela", role: "user" },
  { name: "Anjelika", role: "user" },
];

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not set");
    }
    client = createClient({ url, authToken });
  }
  return client;
}

async function init(): Promise<void> {
  const db = getClient();

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS chart_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL,
        track_name TEXT NOT NULL,
        artist TEXT NOT NULL,
        youtube_id TEXT,
        album_art TEXT,
        period TEXT NOT NULL DEFAULT 'week',
        fetched_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS user_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youtube_url TEXT NOT NULL,
        youtube_id TEXT NOT NULL,
        country_tag TEXT NOT NULL,
        title TEXT,
        added_by TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'user'
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        expires_at INTEGER NOT NULL
      )`,
    ],
    "write"
  );

  // Migration: add period column if missing
  const chartCols = await db.execute("PRAGMA table_info(chart_tracks)");
  if (!chartCols.rows.some((r) => (r as unknown as { name: string }).name === "period")) {
    await db.execute("ALTER TABLE chart_tracks ADD COLUMN period TEXT NOT NULL DEFAULT 'week'");
  }

  // Migration: add avatar column to users if missing
  const userCols = await db.execute("PRAGMA table_info(users)");
  if (!userCols.rows.some((r) => (r as unknown as { name: string }).name === "avatar")) {
    await db.execute("ALTER TABLE users ADD COLUMN avatar TEXT");
  }

  // Seed users if table is empty
  const countRes = await db.execute("SELECT COUNT(*) as count FROM users");
  const count = Number(countRes.rows[0]?.count ?? 0);
  if (count === 0) {
    await db.batch(
      SEED_USERS.map((u) => ({
        sql: "INSERT INTO users (name, role) VALUES (?, ?)",
        args: [u.name, u.role],
      })),
      "write"
    );
  }
}

async function ready(): Promise<Client> {
  if (!initPromise) {
    initPromise = init();
  }
  await initPromise;
  return getClient();
}

export interface ChartTrack {
  id: number;
  country: string;
  track_name: string;
  artist: string;
  youtube_id: string | null;
  album_art: string | null;
  period: string;
  fetched_at: number;
}

export interface UserSong {
  id: number;
  youtube_url: string;
  youtube_id: string;
  country_tag: string;
  title: string | null;
  added_by: string | null;
  created_at: number;
}

export async function getCharts(period: string = "week"): Promise<ChartTrack[]> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT * FROM chart_tracks WHERE period = ? ORDER BY country, id",
    args: [period],
  });
  return res.rows as unknown as ChartTrack[];
}

export async function getChartsAge(period: string = "week"): Promise<number | null> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT MIN(fetched_at) as oldest FROM chart_tracks WHERE period = ?",
    args: [period],
  });
  const oldest = res.rows[0]?.oldest;
  return oldest === null || oldest === undefined ? null : Number(oldest);
}

export async function saveCharts(tracks: Omit<ChartTrack, "id">[], period: string = "week"): Promise<void> {
  const db = await ready();
  const statements = [
    { sql: "DELETE FROM chart_tracks WHERE period = ?", args: [period] },
    ...tracks.map((t) => ({
      sql: "INSERT INTO chart_tracks (country, track_name, artist, youtube_id, album_art, period, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [t.country, t.track_name, t.artist, t.youtube_id, t.album_art, t.period, t.fetched_at],
    })),
  ];
  await db.batch(statements, "write");
}

export async function getUserSongs(): Promise<UserSong[]> {
  const db = await ready();
  const res = await db.execute("SELECT * FROM user_songs ORDER BY created_at DESC");
  return res.rows as unknown as UserSong[];
}

export async function addUserSong(song: Omit<UserSong, "id" | "created_at">): Promise<UserSong> {
  const db = await ready();
  const result = await db.execute({
    sql: "INSERT INTO user_songs (youtube_url, youtube_id, country_tag, title, added_by) VALUES (?, ?, ?, ?, ?)",
    args: [song.youtube_url, song.youtube_id, song.country_tag, song.title, song.added_by],
  });
  const res = await db.execute({
    sql: "SELECT * FROM user_songs WHERE id = ?",
    args: [Number(result.lastInsertRowid)],
  });
  return res.rows[0] as unknown as UserSong;
}

// --- Auth helpers ---

export interface User {
  id: number;
  name: string;
  password_hash: string | null;
  role: string;
}

export interface Session {
  id: number;
  token: string;
  user_id: number;
  expires_at: number;
}

export async function getUnclaimedUsers(): Promise<Pick<User, "id" | "name">[]> {
  const db = await ready();
  const res = await db.execute(
    "SELECT id, name FROM users WHERE password_hash IS NULL ORDER BY name"
  );
  return res.rows as unknown as Pick<User, "id" | "name">[];
}

export async function getUserByName(name: string): Promise<User | undefined> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE name = ? COLLATE NOCASE",
    args: [name],
  });
  return res.rows[0] as unknown as User | undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [id],
  });
  return res.rows[0] as unknown as User | undefined;
}

export async function claimUser(id: number, passwordHash: string): Promise<boolean> {
  const db = await ready();
  const res = await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ? AND password_hash IS NULL",
    args: [passwordHash, id],
  });
  return res.rowsAffected > 0;
}

export async function createSession(token: string, userId: number, expiresAt: number): Promise<void> {
  const db = await ready();
  await db.execute({
    sql: "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    args: [token, userId, expiresAt],
  });
}

export async function getSessionWithUser(
  token: string
): Promise<(Session & { user_name: string; user_role: string }) | undefined> {
  const db = await ready();
  const res = await db.execute({
    sql: `SELECT sessions.*, users.name as user_name, users.role as user_role
          FROM sessions JOIN users ON sessions.user_id = users.id
          WHERE sessions.token = ? AND sessions.expires_at > unixepoch()`,
    args: [token],
  });
  return res.rows[0] as unknown as (Session & { user_name: string; user_role: string }) | undefined;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
}

export async function getUserSongsByName(name: string): Promise<UserSong[]> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT * FROM user_songs WHERE added_by = ? COLLATE NOCASE ORDER BY created_at DESC",
    args: [name],
  });
  return res.rows as unknown as UserSong[];
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<boolean> {
  const db = await ready();
  const res = await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [passwordHash, id],
  });
  return res.rowsAffected > 0;
}

export async function getUserAvatar(id: number): Promise<string | null> {
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT avatar FROM users WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0] as unknown as { avatar: string | null } | undefined;
  return row?.avatar ?? null;
}

export async function updateUserAvatar(id: number, avatar: string): Promise<boolean> {
  const db = await ready();
  const res = await db.execute({
    sql: "UPDATE users SET avatar = ? WHERE id = ?",
    args: [avatar, id],
  });
  return res.rowsAffected > 0;
}
