const { query } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { session_id, referrer } = req.body || {};
  await query(
    `INSERT INTO page_views (session_id,referrer,ip,user_agent) VALUES ($1,$2,$3,$4)`,
    [session_id||'', referrer||'', req.headers['x-forwarded-for']||'', req.headers['user-agent']||'']
  );
  res.json({ success: true });
};
