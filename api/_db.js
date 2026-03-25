// Database helper
// - Local dev:  better-sqlite3 (devDependency, zero setup)
// - Production: Supabase Postgres via pg (DATABASE_URL env var)

const isVercel = !!process.env.VERCEL;

let sqlite = null;
let pgPool  = null;

if (isVercel) {
  // Production — use Postgres (pg)
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1  // keep connections low for serverless
  });
} else {
  // Local dev — use SQLite (devDependency, not installed on Vercel)
  try {
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
  } catch (e) {
    console.warn('better-sqlite3 not available, falling back to pg:', e.message);
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
}

// Unified query helper — $1,$2 placeholders work for both pg and sqlite
async function query(text, params = []) {
  if (pgPool) {
    const result = await pgPool.query(text, params);
    return result.rows;
  }
  // SQLite: convert $1,$2... → ?
  const sqliteQuery = text.replace(/\$\d+/g, '?');
  const stmt = sqlite.prepare(sqliteQuery);
  const isSelect = text.trim().toUpperCase().startsWith('SELECT');
  return isSelect ? stmt.all(...params) : stmt.run(...params);
}

module.exports = { sqlite, pgPool, query };
