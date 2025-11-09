import Database from "better-sqlite3";

const db = new Database("queuectl.db");

db.pragma("journal_mode = WAL");

// --- Initialize tables ---
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    state TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TEXT,
    updated_at TEXT
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS dlq (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    attempts INTEGER,
    created_at TEXT
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`
).run();

// --- Default config values ---
const defaults = {
  "max-retries": "3",
  "backoff-base": "2",
};

for (const [key, value] of Object.entries(defaults)) {
  const exists = db.prepare("SELECT * FROM config WHERE key = ?").get(key);
  if (!exists)
    db.prepare("INSERT INTO config (key, value) VALUES (?, ?)").run(key, value);
}

export default db;
