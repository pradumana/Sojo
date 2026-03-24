const { sqlite, supabase } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query || {};

  if (slug) {
    // Single post by slug
    if (sqlite) {
      const blog = sqlite.prepare(`SELECT * FROM blogs WHERE slug=? AND status='published'`).get(slug);
      if (!blog) return res.status(404).json({ error: 'Not found' });
      return res.json(blog);
    }
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).eq('status', 'published').single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  }

  // All published posts
  if (sqlite) {
    return res.json(sqlite.prepare(`SELECT id,title,slug,excerpt,category,author,cover_color,created_at FROM blogs WHERE status='published' ORDER BY created_at DESC`).all());
  }
  const { data, error } = await supabase.from('blogs').select('id,title,slug,excerpt,category,author,cover_color,created_at').eq('status', 'published').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
