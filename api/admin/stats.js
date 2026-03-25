const { requireAuth } = require('../_auth');
const { query } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAuth(req, res)) return;

  try {
    const [
      views, contacts, events, subs,
      recentContacts, topSections, topEvents,
      interestBreakdown, dailyViews, recentEvents, newsletterList
    ] = await Promise.all([
      query(`SELECT COUNT(*) as c FROM page_views`),
      query(`SELECT COUNT(*) as c FROM contacts`),
      query(`SELECT COUNT(*) as c FROM events`),
      query(`SELECT COUNT(*) as c FROM newsletter`),
      query(`SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20`),
      query(`SELECT page_section, COUNT(*) as count FROM events WHERE page_section!='' GROUP BY page_section ORDER BY count DESC LIMIT 10`),
      query(`SELECT event_type, label, COUNT(*) as count FROM events GROUP BY event_type,label ORDER BY count DESC LIMIT 15`),
      query(`SELECT interest, COUNT(*) as count FROM contacts WHERE interest!='' GROUP BY interest ORDER BY count DESC`),
      query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14`),
      query(`SELECT * FROM events ORDER BY created_at DESC LIMIT 30`),
      query(`SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 20`),
    ]);

    // Unique sessions — count distinct in a separate query
    const sessions = await query(`SELECT COUNT(DISTINCT session_id) as c FROM page_views`);

    res.json({
      summary: {
        totalViews:     parseInt(views[0].c),
        uniqueSessions: parseInt(sessions[0].c),
        totalContacts:  parseInt(contacts[0].c),
        totalEvents:    parseInt(events[0].c),
        subscribers:    parseInt(subs[0].c),
      },
      recentContacts, topSections, topEvents,
      interestBreakdown, dailyViews, recentEvents, newsletterList,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
