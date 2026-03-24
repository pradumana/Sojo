const { sqlite, sql } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { session_id, referrer } = req.body || {};
  const ip = req.headers['x-forwarded-for'] || '';
  const ua = req.headers['user-agent'] || '';

  if (sqlite) {
    sqlite.prepare(`INSERT INTO page_views (session_id,referrer,ip,user_agent) VALUES (?,?,?,?)`)
      .run(session_id||'', referrer||'', ip, ua);
  } else {
    await sql`INSERT INTO page_views (session_id,referrer,ip,user_agent) VALUES (${session_id||''},${referrer||''},${ip},${ua})`;
  }
  res.json({ success: true });
};
