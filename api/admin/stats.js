const { requireAuth } = require('../_auth');
const { sqlite, sql } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!requireAuth(req, res)) return;

  if (sqlite) {
    return res.json({
      summary: {
        totalViews:     sqlite.prepare(`SELECT COUNT(*) as c FROM page_views`).get().c,
        uniqueSessions: sqlite.prepare(`SELECT COUNT(DISTINCT session_id) as c FROM page_views`).get().c,
        totalContacts:  sqlite.prepare(`SELECT COUNT(*) as c FROM contacts`).get().c,
        totalEvents:    sqlite.prepare(`SELECT COUNT(*) as c FROM events`).get().c,
        subscribers:    sqlite.prepare(`SELECT COUNT(*) as c FROM newsletter`).get().c,
      },
      recentContacts:    sqlite.prepare(`SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20`).all(),
      topSections:       sqlite.prepare(`SELECT page_section, COUNT(*) as count FROM events WHERE page_section!='' GROUP BY page_section ORDER BY count DESC LIMIT 10`).all(),
      topEvents:         sqlite.prepare(`SELECT event_type, label, COUNT(*) as count FROM events GROUP BY event_type,label ORDER BY count DESC LIMIT 15`).all(),
      interestBreakdown: sqlite.prepare(`SELECT interest, COUNT(*) as count FROM contacts WHERE interest!='' GROUP BY interest ORDER BY count DESC`).all(),
      dailyViews:        sqlite.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14`).all(),
      recentEvents:      sqlite.prepare(`SELECT * FROM events ORDER BY created_at DESC LIMIT 30`).all(),
      newsletterList:    sqlite.prepare(`SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 20`).all(),
    });
  }

  // Vercel Postgres
  const [views, sessions, contacts, events, subs, recentContacts, topSections, topEvents, interests, daily, recentEv, newsletter] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM page_views`,
    sql`SELECT COUNT(DISTINCT session_id) as c FROM page_views`,
    sql`SELECT COUNT(*) as c FROM contacts`,
    sql`SELECT COUNT(*) as c FROM events`,
    sql`SELECT COUNT(*) as c FROM newsletter`,
    sql`SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20`,
    sql`SELECT page_section, COUNT(*) as count FROM events WHERE page_section!='' GROUP BY page_section ORDER BY count DESC LIMIT 10`,
    sql`SELECT event_type, label, COUNT(*) as count FROM events GROUP BY event_type,label ORDER BY count DESC LIMIT 15`,
    sql`SELECT interest, COUNT(*) as count FROM contacts WHERE interest!='' GROUP BY interest ORDER BY count DESC`,
    sql`SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14`,
    sql`SELECT * FROM events ORDER BY created_at DESC LIMIT 30`,
    sql`SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 20`,
  ]);

  res.json({
    summary: { totalViews: views.rows[0].c, uniqueSessions: sessions.rows[0].c, totalContacts: contacts.rows[0].c, totalEvents: events.rows[0].c, subscribers: subs.rows[0].c },
    recentContacts: recentContacts.rows, topSections: topSections.rows, topEvents: topEvents.rows,
    interestBreakdown: interests.rows, dailyViews: daily.rows, recentEvents: recentEv.rows, newsletterList: newsletter.rows,
  });
};
