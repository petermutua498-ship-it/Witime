import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("❌ DB error:", err.message);
  } else {
    console.log("✅ Database connected");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      code TEXT,
      minutes INTEGER,
      expires_at INTEGER,
      status TEXT
    )
  `, (err) => {
    if (err) console.error("❌ Table error:", err);
    else console.log("✅ Table ready");
  });
});

export default db;
