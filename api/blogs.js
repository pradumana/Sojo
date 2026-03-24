const { v4: uuidv4 } = require('uuid');
const { sqlite, sql } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query || {};

  if (slug) {
    // GET /api/blogs?slug=xxx — single post
    let blog;
    if (sqlite) {
      blog = sqlite.prepare(`SELECT * FROM blogs WHERE slug=? AND status='published'`).get(slug);
    } else {
      const { rows } = await sql`SELECT * FROM blogs WHERE slug=${slug} AND status='published'`;
      blog = rows[0];
    }
    if (!blog) return res.status(404).json({ error: 'Not found' });
    return res.json(blog);
  }

  // GET /api/blogs — all published
  if (sqlite) {
    return res.json(sqlite.prepare(`SELECT id,title,slug,excerpt,category,author,cover_color,created_at FROM blogs WHERE status='published' ORDER BY created_at DESC`).all());
  }
  const { rows } = await sql`SELECT id,title,slug,excerpt,category,author,cover_color,created_at FROM blogs WHERE status='published' ORDER BY created_at DESC`;
  res.json(rows);
};
