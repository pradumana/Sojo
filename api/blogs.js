const { query } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query || {};

  try {
    if (slug) {
      const rows = await query(`SELECT * FROM blogs WHERE slug=$1 AND status='published'`, [slug]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }
    const rows = await query(`SELECT id,title,slug,excerpt,category,author,cover_color,created_at FROM blogs WHERE status='published' ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
