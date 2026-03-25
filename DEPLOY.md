# Deploying Social Jobs to Vercel + Supabase

## Stack
| Service | Role | Cost |
|---|---|---|
| **Vercel** | Hosts HTML + serverless API | Free |
| **Supabase** | Postgres database | Free (500MB) |

---

## Step 1 — Create tables in Supabase (2 min)

Go to your Supabase project → **SQL Editor** → run this:

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

---

## Step 2 — Deploy to Vercel

1. Go to https://vercel.com → New Project → Import `pradumana/Sojo`
2. Add these **Environment Variables**:

```
DATABASE_URL   = postgresql://postgres:GJDW89hNcCq0RUPg@db.nefbqenwcrpezudcwecq.supabase.co:5432/postgres
ADMIN_EMAIL    = socialsambhawana@gmail.com
ADMIN_PASSWORD = Sojo@2026
JWT_SECRET     = SoJo$F0und@tion#2026!xK9mPqR3vL7nW2
```

3. Click **Deploy**

---

## URLs after deployment

| Page | URL |
|---|---|
| Website | `https://your-site.vercel.app` |
| Admin Login | `https://your-site.vercel.app/admin-login.html` |
| Blogs | `https://your-site.vercel.app/blogs.html` |

---

## Local development

```bash
node server.js
# → http://localhost:3000  (uses local SQLite, no Supabase needed)
```
