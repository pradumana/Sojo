const { v4: uuidv4 } = require('uuid');
const { query } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, interest, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    await query(
      `INSERT INTO contacts (id,name,email,interest,message,ip) VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), name, email, interest || '', message, req.headers['x-forwarded-for'] || '']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
