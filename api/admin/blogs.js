const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../_auth');
const { sqlite, sql } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const { id } = req.query || {};

  // DELETE /api/admin/blogs?id=xxx
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID required' });
    if (sqlite) sqlite.prepare(`DELETE FROM blogs WHERE id=?`).run(id);
    else await sql`DELETE FROM blogs WHERE id=${id}`;
    return res.json({ success: true });
  }

  // PUT /api/admin/blogs?id=xxx
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID required' });
    const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
    if (sqlite) {
      sqlite.prepare(`UPDATE blogs SET title=?,excerpt=?,content=?,category=?,author=?,cover_color=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .run(title, excerpt||'', content, category||'General', author||'Social Jobs Team', cover_color||'linear-gradient(135deg,#667eea,#764ba2)', status||'draft', id);
    } else {
      await sql`UPDATE blogs SET title=${title},excerpt=${excerpt||''},content=${content},category=${category||'General'},author=${author||'Social Jobs Team'},cover_color=${cover_color||'linear-gradient(135deg,#667eea,#764ba2)'},status=${status||'draft'},updated_at=NOW() WHERE id=${id}`;
    }
    return res.json({ success: true });
  }

  // POST /api/admin/blogs
  if (req.method === 'POST') {
    const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const newId = uuidv4();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + newId.slice(0, 6);
    if (sqlite) {
      sqlite.prepare(`INSERT INTO blogs (id,title,slug,excerpt,content,category,author,cover_color,status) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(newId, title, slug, excerpt||'', content, category||'General', author||'Social Jobs Team', cover_color||'linear-gradient(135deg,#667eea,#764ba2)', status||'draft');
    } else {
      await sql`INSERT INTO blogs (id,title,slug,excerpt,content,category,author,cover_color,status) VALUES (${newId},${title},${slug},${excerpt||''},${content},${category||'General'},${author||'Social Jobs Team'},${cover_color||'linear-gradient(135deg,#667eea,#764ba2)'},${status||'draft'})`;
    }
    return res.json({ success: true, id: newId, slug });
  }

  // GET /api/admin/blogs — all including drafts
  if (sqlite) return res.json(sqlite.prepare(`SELECT * FROM blogs ORDER BY created_at DESC`).all());
  const { rows } = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
  res.json(rows);
};
