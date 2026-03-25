const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../_auth');
const { query } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAuth(req, res)) return;

  const { id } = req.query || {};

  try {
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID required' });
      await query(`DELETE FROM blogs WHERE id=$1`, [id]);
      return res.json({ success: true });
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
      await query(
        `UPDATE blogs SET title=$1,excerpt=$2,content=$3,category=$4,author=$5,cover_color=$6,status=$7,updated_at=NOW() WHERE id=$8`,
        [title, excerpt||'', content, category||'General', author||'Social Jobs Team', cover_color||'linear-gradient(135deg,#667eea,#764ba2)', status||'draft', id]
      );
      return res.json({ success: true });
    }

    if (req.method === 'POST') {
      const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
      if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
      const newId = uuidv4();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + newId.slice(0, 6);
      await query(
        `INSERT INTO blogs (id,title,slug,excerpt,content,category,author,cover_color,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId, title, slug, excerpt||'', content, category||'General', author||'Social Jobs Team', cover_color||'linear-gradient(135deg,#667eea,#764ba2)', status||'draft']
      );
      return res.json({ success: true, id: newId, slug });
    }

    // GET — all blogs including drafts
    const rows = await query(`SELECT * FROM blogs ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
