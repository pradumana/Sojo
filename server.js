const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// ── CONFIG ────────────────────────────────────────────────────
// Change these before deploying! Store in env vars in production.
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@socialjobs.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SoJo@2025!';   // plain text only for local dev
const JWT_SECRET     = process.env.JWT_SECRET     || 'sojo-super-secret-jwt-key-change-in-prod';
const JWT_EXPIRES    = '8h';

// Hash the password once at startup (so we never compare plain text)
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// ── DATABASE ──────────────────────────────────────────────────
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
const db = new Database(path.join(dbDir, 'interactions.db'));

db.exec(`
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

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const getIP = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── POST /api/auth/login ──────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Constant-time comparison to prevent timing attacks
  const emailMatch = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passMatch  = await bcrypt.compare(password, ADMIN_HASH);

  if (!emailMatch || !passMatch) {
    // Small delay to slow brute force
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ success: true, token, expiresIn: JWT_EXPIRES });
});

// ── POST /api/auth/verify ─────────────────────────────────────
app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, email: req.admin.email });
});

// ── PUBLIC ROUTES ─────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, interest, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  db.prepare(`INSERT INTO contacts (id,name,email,interest,message,ip) VALUES (?,?,?,?,?,?)`)
    .run(uuidv4(), name, email, interest || '', message, getIP(req));
  res.json({ success: true });
});

app.post('/api/event', (req, res) => {
  const { session_id, event_type, label, page_section } = req.body;
  db.prepare(`INSERT INTO events (session_id,event_type,label,page_section,ip,user_agent) VALUES (?,?,?,?,?,?)`)
    .run(session_id || '', event_type || '', label || '', page_section || '', getIP(req), req.headers['user-agent'] || '');
  res.json({ success: true });
});

app.post('/api/pageview', (req, res) => {
  const { session_id, referrer } = req.body;
  db.prepare(`INSERT INTO page_views (session_id,referrer,ip,user_agent) VALUES (?,?,?,?)`)
    .run(session_id || '', referrer || '', getIP(req), req.headers['user-agent'] || '');
  res.json({ success: true });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    db.prepare(`INSERT INTO newsletter (id,email,ip) VALUES (?,?,?)`)
      .run(uuidv4(), email, getIP(req));
    res.json({ success: true });
  } catch { res.status(409).json({ error: 'Already subscribed' }); }
});

app.get('/api/blogs', (_req, res) => {
  res.json(db.prepare(`SELECT id,title,slug,excerpt,category,author,cover_color,created_at FROM blogs WHERE status='published' ORDER BY created_at DESC`).all());
});

app.get('/api/blogs/:slug', (req, res) => {
  const blog = db.prepare(`SELECT * FROM blogs WHERE slug=? AND status='published'`).get(req.params.slug);
  if (!blog) return res.status(404).json({ error: 'Not found' });
  res.json(blog);
});

// ── PROTECTED ADMIN ROUTES (require JWT) ─────────────────────
app.get('/api/admin/stats', requireAuth, (req, res) => {
  res.json({
    summary: {
      totalViews:     db.prepare(`SELECT COUNT(*) as c FROM page_views`).get().c,
      uniqueSessions: db.prepare(`SELECT COUNT(DISTINCT session_id) as c FROM page_views`).get().c,
      totalContacts:  db.prepare(`SELECT COUNT(*) as c FROM contacts`).get().c,
      totalEvents:    db.prepare(`SELECT COUNT(*) as c FROM events`).get().c,
      subscribers:    db.prepare(`SELECT COUNT(*) as c FROM newsletter`).get().c,
    },
    recentContacts:     db.prepare(`SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20`).all(),
    topSections:        db.prepare(`SELECT page_section, COUNT(*) as count FROM events WHERE page_section!='' GROUP BY page_section ORDER BY count DESC LIMIT 10`).all(),
    topEvents:          db.prepare(`SELECT event_type, label, COUNT(*) as count FROM events GROUP BY event_type,label ORDER BY count DESC LIMIT 15`).all(),
    interestBreakdown:  db.prepare(`SELECT interest, COUNT(*) as count FROM contacts WHERE interest!='' GROUP BY interest ORDER BY count DESC`).all(),
    dailyViews:         db.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14`).all(),
    recentEvents:       db.prepare(`SELECT * FROM events ORDER BY created_at DESC LIMIT 30`).all(),
    newsletterList:     db.prepare(`SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 20`).all(),
  });
});

app.get('/api/admin/blogs', requireAuth, (_req, res) => {
  res.json(db.prepare(`SELECT * FROM blogs ORDER BY created_at DESC`).all());
});

app.post('/api/admin/blogs', requireAuth, (req, res) => {
  const { title, excerpt, content, category, author, cover_color, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const id = uuidv4();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 6);
  db.prepare(`INSERT INTO blogs (id,title,slug,excerpt,content,category,author,cover_color,status) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, title, slug, excerpt || '', content, category || 'General', author || 'Social Jobs Team', cover_color || 'linear-gradient(135deg,#667eea,#764ba2)', status || 'draft');
  res.json({ success: true, id, slug });
});

app.put('/api/admin/blogs/:id', requireAuth, (req, res) => {
  const { title, excerpt, content, category, author, cover_color, status } = req.body;
  db.prepare(`UPDATE blogs SET title=?,excerpt=?,content=?,category=?,author=?,cover_color=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(title, excerpt || '', content, category || 'General', author || 'Social Jobs Team', cover_color || 'linear-gradient(135deg,#667eea,#764ba2)', status || 'draft', req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/blogs/:id', requireAuth, (req, res) => {
  db.prepare(`DELETE FROM blogs WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Social Jobs server running → http://localhost:${PORT}`);
  console.log(`🔐 Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`📊 Dashboard:  http://localhost:${PORT}/admin-login.html`);
});
