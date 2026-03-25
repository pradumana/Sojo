const { v4: uuidv4 } = require('uuid');
const { query } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    await query(
      `INSERT INTO newsletter (id,email,ip) VALUES ($1,$2,$3)`,
      [uuidv4(), email, req.headers['x-forwarded-for']||'']
    );
    res.json({ success: true });
  } catch (e) {
    if (e.code === '23505' || (e.message && e.message.includes('UNIQUE'))) {
      return res.status(409).json({ error: 'Already subscribed' });
    }
    res.status(500).json({ error: e.message });
  }
};
