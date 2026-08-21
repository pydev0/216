import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "line-radio.db");

let db: Database.Database | null = null;

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

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS chart_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL,
        track_name TEXT NOT NULL,
        artist TEXT NOT NULL,
        youtube_id TEXT,
        album_art TEXT,
        period TEXT NOT NULL DEFAULT 'week',
        fetched_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youtube_url TEXT NOT NULL,
        youtube_id TEXT NOT NULL,
        country_tag TEXT NOT NULL,
        title TEXT,
        added_by TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        expires_at INTEGER NOT NULL
      );
    `);

    // Migration: add period column if missing
    const columns = db.prepare("PRAGMA table_info(chart_tracks)").all() as { name: string }[];
    if (!columns.some((c) => c.name === "period")) {
      db.exec("ALTER TABLE chart_tracks ADD COLUMN period TEXT NOT NULL DEFAULT 'week'");
    }

    // Migration: add avatar column to users if missing
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!userColumns.some((c) => c.name === "avatar")) {
      db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
    }

    // Seed users if table is empty
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (userCount.count === 0) {
      const insert = db.prepare("INSERT INTO users (name, role) VALUES (?, ?)");
      for (const u of SEED_USERS) {
        insert.run(u.name, u.role);
      }
    }
  }
  return db;
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

export function getCharts(period: string = "week"): ChartTrack[] {
  return getDb().prepare("SELECT * FROM chart_tracks WHERE period = ? ORDER BY country, id").all(period) as ChartTrack[];
}

export function getChartsAge(period: string = "week"): number | null {
  const row = getDb().prepare("SELECT MIN(fetched_at) as oldest FROM chart_tracks WHERE period = ?").get(period) as { oldest: number | null } | undefined;
  return row?.oldest ?? null;
}

export function saveCharts(tracks: Omit<ChartTrack, "id">[], period: string = "week") {
  const d = getDb();
  const deleteStmt = d.prepare("DELETE FROM chart_tracks WHERE period = ?");
  const insertStmt = d.prepare(
    "INSERT INTO chart_tracks (country, track_name, artist, youtube_id, album_art, period, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const transaction = d.transaction((tracks: Omit<ChartTrack, "id">[]) => {
    deleteStmt.run(period);
    for (const t of tracks) {
      insertStmt.run(t.country, t.track_name, t.artist, t.youtube_id, t.album_art, t.period, t.fetched_at);
    }
  });

  transaction(tracks);
}

export function getUserSongs(): UserSong[] {
  return getDb().prepare("SELECT * FROM user_songs ORDER BY created_at DESC").all() as UserSong[];
}

export function addUserSong(song: Omit<UserSong, "id" | "created_at">): UserSong {
  const d = getDb();
  const result = d.prepare(
    "INSERT INTO user_songs (youtube_url, youtube_id, country_tag, title, added_by) VALUES (?, ?, ?, ?, ?)"
  ).run(song.youtube_url, song.youtube_id, song.country_tag, song.title, song.added_by);

  return d.prepare("SELECT * FROM user_songs WHERE id = ?").get(result.lastInsertRowid) as UserSong;
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

export function getUnclaimedUsers(): Pick<User, "id" | "name">[] {
  return getDb()
    .prepare("SELECT id, name FROM users WHERE password_hash IS NULL ORDER BY name")
    .all() as Pick<User, "id" | "name">[];
}

export function getUserByName(name: string): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE name = ? COLLATE NOCASE")
    .get(name) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as User | undefined;
}

export function claimUser(id: number, passwordHash: string): boolean {
  const result = getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ? AND password_hash IS NULL")
    .run(passwordHash, id);
  return result.changes > 0;
}

export function createSession(token: string, userId: number, expiresAt: number): void {
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expiresAt);
}

export function getSessionWithUser(token: string): (Session & { user_name: string; user_role: string }) | undefined {
  return getDb()
    .prepare(
      `SELECT sessions.*, users.name as user_name, users.role as user_role
       FROM sessions JOIN users ON sessions.user_id = users.id
       WHERE sessions.token = ? AND sessions.expires_at > unixepoch()`
    )
    .get(token) as (Session & { user_name: string; user_role: string }) | undefined;
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getUserSongsByName(name: string): UserSong[] {
  return getDb()
    .prepare("SELECT * FROM user_songs WHERE added_by = ? COLLATE NOCASE ORDER BY created_at DESC")
    .all(name) as UserSong[];
}

export function updateUserPassword(id: number, passwordHash: string): boolean {
  const result = getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(passwordHash, id);
  return result.changes > 0;
}

export function getUserAvatar(id: number): string | null {
  const row = getDb()
    .prepare("SELECT avatar FROM users WHERE id = ?")
    .get(id) as { avatar: string | null } | undefined;
  return row?.avatar ?? null;
}

export function updateUserAvatar(id: number, avatar: string): boolean {
  const result = getDb()
    .prepare("UPDATE users SET avatar = ? WHERE id = ?")
    .run(avatar, id);
  return result.changes > 0;
}
