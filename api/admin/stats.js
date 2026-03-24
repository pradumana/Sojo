const { requireAuth } = require('../_auth');
const { sqlite, supabase } = require('../_db');

async function sbCount(table) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count || 0;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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

  // Supabase
  const [
    totalViews, uniqueSessionsRes, totalContacts, totalEvents, subscribers,
    { data: recentContacts },
    { data: topSections },
    { data: topEvents },
    { data: interestBreakdown },
    { data: dailyViews },
    { data: recentEvents },
    { data: newsletterList }
  ] = await Promise.all([
    sbCount('page_views'),
    supabase.from('page_views').select('session_id'),
    sbCount('contacts'),
    sbCount('events'),
    sbCount('newsletter'),
    supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.rpc('top_sections'),
    supabase.rpc('top_events'),
    supabase.rpc('interest_breakdown'),
    supabase.rpc('daily_views'),
    supabase.from('events').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('newsletter').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  // Count unique sessions client-side (Supabase free tier has no DISTINCT COUNT via REST)
  const uniqueSessions = new Set((uniqueSessionsRes.data || []).map(r => r.session_id)).size;

  res.json({
    summary: { totalViews, uniqueSessions, totalContacts, totalEvents, subscribers },
    recentContacts: recentContacts || [],
    topSections: topSections || [],
    topEvents: topEvents || [],
    interestBreakdown: interestBreakdown || [],
    dailyViews: dailyViews || [],
    recentEvents: recentEvents || [],
    newsletterList: newsletterList || [],
  });
};
