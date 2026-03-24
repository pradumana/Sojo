// Shared auth helper for all API functions
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sojo-super-secret-jwt-key-change-in-prod';

function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const admin = verifyToken(req);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return admin;
}

module.exports = { verifyToken, requireAuth, JWT_SECRET };
