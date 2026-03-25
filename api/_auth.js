const jwt = require('jsonwebtoken');

function requireAuth(req, res) {
  const JWT_SECRET = process.env.JWT_SECRET || 'SoJo$F0und@tion#2026!xK9mPqR3vL7nW2';
  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

module.exports = { requireAuth };
