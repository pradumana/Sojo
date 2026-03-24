const { v4: uuidv4 } = require('uuid');
const { sqlite, supabase } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const id = uuidv4();
  const ip = req.headers['x-forwarded-for'] || '';

  if (sqlite) {
    try {
      sqlite.prepare(`INSERT INTO newsletter (id,email,ip) VALUES (?,?,?)`).run(id, email, ip);
      res.json({ success: true });
    } catch { res.status(409).json({ error: 'Already subscribed' }); }
  } else {
    const { error } = await supabase.from('newsletter').insert({ id, email, ip });
    if (error && error.code === '23505') return res.status(409).json({ error: 'Already subscribed' });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  }
};
