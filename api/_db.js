// Database helper
// - Local dev:  better-sqlite3 (zero setup)
// - Production: Supabase Postgres via pg (set DATABASE_URL env var)

const isVercel = !!process.env.VERCEL;

let sqlite = null;
let pgPool  = null;

if (isVercel) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
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

// Unified query: use pg on Vercel, sqlite locally
async function query(text, params = []) {
  if (pgPool) {
    const result = await pgPool.query(text, params);
    return result.rows;
  }
  // Convert $1,$2... placeholders to ? for SQLite
  let i = 0;
  const sqliteQuery = text.replace(/\$\d+/g, () => { i++; return '?'; });
  const stmt = sqlite.prepare(sqliteQuery);
  // Use .all() for SELECT, .run() for INSERT/UPDATE/DELETE
  const isSelect = text.trim().toUpperCase().startsWith('SELECT');
  return isSelect ? stmt.all(...params) : stmt.run(...params);
}

module.exports = { sqlite, pgPool, query };
