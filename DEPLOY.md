# Deploying Social Jobs to Vercel + Supabase

## Stack
| Service | Role | Cost |
|---|---|---|
| **Vercel** | Hosts HTML + serverless API | Free |
| **Supabase** | Postgres database | Free (500MB) |

---

## Step 1 — Set up Supabase (5 min)

1. Go to https://supabase.com → create free account → New Project
2. Choose a region close to India (e.g. Singapore)
3. Go to **SQL Editor** and run this to create all tables:

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, interest TEXT,
  message TEXT, ip TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY, session_id TEXT, event_type TEXT,
  label TEXT, page_section TEXT, ip TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY, session_id TEXT, referrer TEXT,
  ip TEXT, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY, email TEXT UNIQUE, ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  excerpt TEXT, content TEXT, category TEXT, author TEXT,
  cover_color TEXT DEFAULT 'linear-gradient(135deg,#667eea,#764ba2)',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. Also run these SQL functions (used by the admin stats dashboard):

```sql
CREATE OR REPLACE FUNCTION top_sections()
RETURNS TABLE(page_section TEXT, count BIGINT) AS $$
  SELECT page_section, COUNT(*) as count FROM events
  WHERE page_section != '' GROUP BY page_section ORDER BY count DESC LIMIT 10;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION top_events()
RETURNS TABLE(event_type TEXT, label TEXT, count BIGINT) AS $$
  SELECT event_type, label, COUNT(*) as count FROM events
  GROUP BY event_type, label ORDER BY count DESC LIMIT 15;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION interest_breakdown()
RETURNS TABLE(interest TEXT, count BIGINT) AS $$
  SELECT interest, COUNT(*) as count FROM contacts
  WHERE interest != '' GROUP BY interest ORDER BY count DESC;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION daily_views()
RETURNS TABLE(date DATE, count BIGINT) AS $$
  SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views
  GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14;
$$ LANGUAGE sql;
```

5. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_KEY`

---

## Step 2 — Deploy to Vercel

### Via GitHub (easiest)
1. Push this repo to GitHub (already done)
2. Go to https://vercel.com → New Project → Import `pradumana/Sojo`
3. Add these **Environment Variables**:

```
SUPABASE_URL         = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGci...  (service_role key)
ADMIN_EMAIL          = your@email.com
ADMIN_PASSWORD       = YourStrongPassword123!
JWT_SECRET           = any-long-random-string-nobody-can-guess
```

4. Click **Deploy**

---

## URLs after deployment

| Page | URL |
|---|---|
| Website | `https://your-site.vercel.app` |
| Admin Login | `https://your-site.vercel.app/admin-login.html` |
| Blog Listing | `https://your-site.vercel.app/blogs.html` |

---

## Local development

```bash
node server.js
# → http://localhost:3000
# Uses local SQLite — no Supabase needed locally
```
