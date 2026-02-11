const Database = require("better-sqlite3");

const db = new Database("wifi.db");

// USERS TABLE
db.prepare(`
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  ip TEXT,
  start_time INTEGER,
  end_time INTEGER,
  status TEXT
)
`).run();

// PAYMENTS TABLE
db.prepare(`
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  amount INTEGER,
  duration INTEGER,
  status TEXT,
  created_at INTEGER
)
`).run();

module.exports = db;
