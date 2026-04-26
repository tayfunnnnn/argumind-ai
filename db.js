const Database = require("better-sqlite3");

const db = new Database("users.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sprints (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sprint_id  INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    kategori   TEXT,
    status     TEXT    NOT NULL DEFAULT 'YAPILACAK',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try { db.exec(`ALTER TABLE tasks ADD COLUMN kategori TEXT`); } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limit (
    ip           TEXT    PRIMARY KEY,
    sayi         INTEGER NOT NULL DEFAULT 1,
    sifirlanacak INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id              INTEGER,
    fikir                TEXT,
    userValue            TEXT,
    businessStrategy     TEXT,
    technicalFeasibility TEXT,
    boss_karar           TEXT,
    boss_skor            REAL,
    boss_aciklama        TEXT,
    boss_gucluYonler     TEXT,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
