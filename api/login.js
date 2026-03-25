const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'socialsambhawana@gmail.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sojo@2026';
  const JWT_SECRET     = process.env.JWT_SECRET     || 'SoJo$F0und@tion#2026!xK9mPqR3vL7nW2';

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emailMatch = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passMatch  = password === ADMIN_PASSWORD;

  if (!emailMatch || !passMatch) {
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ success: true, token, expiresIn: '8h' });
};
