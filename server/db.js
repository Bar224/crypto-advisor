const Database = require("better-sqlite3");

const db = new Database("database.db");

// Users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )
`).run();

// Preferences table
db.prepare(`
  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE,
    assets TEXT,
    investorType TEXT,
    content TEXT,
    updatedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`).run();

// Votes table (likes / dislikes per section)
db.prepare(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    section TEXT NOT NULL,
    vote TEXT NOT NULL,          -- "up" | "down"
    updatedAt TEXT NOT NULL,
    UNIQUE(userId, section),
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`).run();

module.exports = db;
