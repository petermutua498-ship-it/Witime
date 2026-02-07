import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
cost _dirname = path.dirname(_fileame);

const db = new sqlite3.dataase(path.joi(_dirname, 'witime.db'));

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("DB error:", err.message);
  } else {
    console.log("Database connected");
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
