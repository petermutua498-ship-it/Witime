const database = require('better sqlite3');

const db = new Database('witime.db');

// Sessions table
db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      code TEXT UNIQUE,
      start_time INTEGER,
      end_time INTEGER,
      status TEXT
    )
`).run();

module.exports = db;
