// Production: pg → Supabase Postgres (DATABASE_URL env var)
// Local dev:  better-sqlite3 (devDependency)

let pgPool  = null;
let sqlite  = null;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1
  });
} else {
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs   = require('fs');
    const dbDir = path.join(__dirname, '..', 'db');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    sqlite = new Database(path.join(dbDir, 'interactions.db'));
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, email TEXT, interest TEXT, message TEXT, ip TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, event_type TEXT, label TEXT, page_section TEXT, ip TEXT, user_agent TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS page_views (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, referrer TEXT, ip TEXT, user_agent TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS newsletter (id TEXT PRIMARY KEY, email TEXT UNIQUE, ip TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS blogs (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, excerpt TEXT, content TEXT, category TEXT, author TEXT, cover_color TEXT DEFAULT 'linear-gradient(135deg,#667eea,#764ba2)', status TEXT DEFAULT 'draft', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);
  } catch (e) {
    console.error('SQLite init failed:', e.message);
  }
}

async function query(text, params = []) {
  if (pgPool) {
    const result = await pgPool.query(text, params);
    return result.rows;
  }
  if (sqlite) {
    const sqliteQuery = text.replace(/\$\d+/g, '?');
    const stmt = sqlite.prepare(sqliteQuery);
    const isSelect = text.trim().toUpperCase().startsWith('SELECT');
    return isSelect ? stmt.all(...params) : stmt.run(...params);
  }
  throw new Error('No database connection available');
}

module.exports = { query };
