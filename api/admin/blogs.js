const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../_auth');
const { sqlite, supabase } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAuth(req, res)) return;

  const { id } = req.query || {};

  // DELETE
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID required' });
    if (sqlite) sqlite.prepare(`DELETE FROM blogs WHERE id=?`).run(id);
    else await supabase.from('blogs').delete().eq('id', id);
    return res.json({ success: true });
  }

  // PUT (update)
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID required' });
    const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
    const updated = { title, excerpt: excerpt || '', content, category: category || 'General', author: author || 'Social Jobs Team', cover_color: cover_color || 'linear-gradient(135deg,#667eea,#764ba2)', status: status || 'draft', updated_at: new Date().toISOString() };
    if (sqlite) {
      sqlite.prepare(`UPDATE blogs SET title=?,excerpt=?,content=?,category=?,author=?,cover_color=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .run(updated.title, updated.excerpt, updated.content, updated.category, updated.author, updated.cover_color, updated.status, id);
    } else {
      const { error } = await supabase.from('blogs').update(updated).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  }

  // POST (create)
  if (req.method === 'POST') {
    const { title, excerpt, content, category, author, cover_color, status } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const newId = uuidv4();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + newId.slice(0, 6);
    const row = { id: newId, title, slug, excerpt: excerpt || '', content, category: category || 'General', author: author || 'Social Jobs Team', cover_color: cover_color || 'linear-gradient(135deg,#667eea,#764ba2)', status: status || 'draft' };
    if (sqlite) {
      sqlite.prepare(`INSERT INTO blogs (id,title,slug,excerpt,content,category,author,cover_color,status) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(row.id, row.title, row.slug, row.excerpt, row.content, row.category, row.author, row.cover_color, row.status);
    } else {
      const { error } = await supabase.from('blogs').insert(row);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true, id: newId, slug });
  }

  // GET — all blogs including drafts
  if (sqlite) return res.json(sqlite.prepare(`SELECT * FROM blogs ORDER BY created_at DESC`).all());
  const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
