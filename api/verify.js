const { requireAuth } = require('./_auth');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAuth(req, res);
  if (!admin) return;
  res.json({ valid: true, email: admin.email });
};
