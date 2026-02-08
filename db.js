const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'witime.db'));

// Sessions table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      code TEXT UNIQUE,
      minutes INTEGER,
      start_time INTEGER,
      end_time INTEGER,
      status TEXT,
      ip TEXT,
      user_agent TEXT
    )
  `);

  // Pending payments queue
  db.run(`
    CREATE TABLE IF NOT EXISTS pending_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      amount INTEGER NOT NULL,
      requested_at INTEGER NOT NULL
    )
  `);
});

module.exports = db;
