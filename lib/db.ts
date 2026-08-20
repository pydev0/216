import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "line-radio.db");

let db: Database.Database | null = null;

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
    `);

    // Migration: add period column if missing
    const columns = db.prepare("PRAGMA table_info(chart_tracks)").all() as { name: string }[];
    if (!columns.some((c) => c.name === "period")) {
      db.exec("ALTER TABLE chart_tracks ADD COLUMN period TEXT NOT NULL DEFAULT 'week'");
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
