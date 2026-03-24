const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./_auth');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@socialjobs.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SoJo@2025!';
const ADMIN_HASH     = bcrypt.hashSync(ADMIN_PASSWORD, 10);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emailMatch = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passMatch  = await bcrypt.compare(password, ADMIN_HASH);

  if (!emailMatch || !passMatch) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ success: true, token, expiresIn: '8h' });
};
