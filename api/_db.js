// Database helper
// - Local dev:  better-sqlite3 (no setup needed)
// - Production: Supabase (set SUPABASE_URL + SUPABASE_SERVICE_KEY env vars)

const isVercel = !!process.env.VERCEL;

let sqlite   = null;
let supabase = null;

if (isVercel) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
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

module.exports = { sqlite, supabase };
