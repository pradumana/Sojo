// Database helper
// - Local dev: better-sqlite3 (fast, no setup)
// - Vercel production: Neon serverless Postgres (set DATABASE_URL env var)

const isVercel = !!process.env.VERCEL;

let sqlite = null;
let neon   = null;

if (isVercel) {
  const { neon: createNeon } = require('@neondatabase/serverless');
  neon = createNeon(process.env.DATABASE_URL);
} else {
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs   = require('fs');
  const dbDir = path.join(__dirname, '..', 'db');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  sqlite = new Database(path.join(dbDir, 'interactions.db'));
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY, name TEXT, email TEXT, interest TEXT,
      message TEXT, ip TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT,
      event_type TEXT, label TEXT, page_section TEXT,
      ip TEXT, user_agent TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT,
      referrer TEXT, ip TEXT, user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS newsletter (
      id TEXT PRIMARY KEY, email TEXT UNIQUE, ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      excerpt TEXT, content TEXT, category TEXT, author TEXT,
      cover_color TEXT DEFAULT 'linear-gradient(135deg,#667eea,#764ba2)',
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Unified query helper — use tagged template for Neon, prepare() for SQLite
async function query(strings, ...values) {
  if (neon) return neon(strings, ...values);
  // For SQLite, reconstruct the query with ? placeholders
  let sql = '';
  strings.forEach((s, i) => { sql += s; if (i < values.length) sql += '?'; });
  return sqlite.prepare(sql).all(...values);
}

module.exports = { sqlite, neon, query };
