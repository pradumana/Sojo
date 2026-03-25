const { query } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { session_id, event_type, label, page_section } = req.body || {};
  await query(
    `INSERT INTO events (session_id,event_type,label,page_section,ip,user_agent) VALUES ($1,$2,$3,$4,$5,$6)`,
    [session_id||'', event_type||'', label||'', page_section||'', req.headers['x-forwarded-for']||'', req.headers['user-agent']||'']
  );
  res.json({ success: true });
};
