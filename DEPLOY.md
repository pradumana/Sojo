# Deploying Social Jobs to Vercel

## The Problem with SQLite on Vercel
Vercel runs **serverless functions** — the filesystem is read-only and ephemeral.
SQLite won't work. You need a hosted database.

## Recommended Free Stack for Vercel

| Service | What it does | Free tier |
|---|---|---|
| **Vercel** | Hosts HTML + API functions | Free forever |
| **Supabase** | Postgres database (replaces SQLite) | 500MB free |

---

## Step 1 — Set up Supabase (5 minutes)

1. Go to https://supabase.com and create a free account
2. Create a new project (pick any region close to India)
3. Go to **SQL Editor** and run this:

```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT, email TEXT, interest TEXT, message TEXT, ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT, event_type TEXT, label TEXT, page_section TEXT,
  ip TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT, referrer TEXT, ip TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE newsletter (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE, ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE blogs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  excerpt TEXT, content TEXT, category TEXT, author TEXT,
  cover_color TEXT DEFAULT 'linear-gradient(135deg,#667eea,#764ba2)',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. Go to **Settings → API** and copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `service_role` secret key → this is your `SUPABASE_SERVICE_KEY`

---

## Step 2 — Deploy to Vercel

### Option A: Via Vercel CLI (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Inside the socialjobs-website folder:
vercel

# Follow prompts — say YES to all defaults
# When asked for environment variables, add:
#   SUPABASE_URL = your project URL
#   SUPABASE_SERVICE_KEY = your service_role key
```

### Option B: Via GitHub (easiest)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Set root directory to `socialjobs-website`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Click Deploy

---

## Step 3 — Update API base URL in frontend

After deploying, update the `API` constant in these files:
- `script.js` line 2: change `http://localhost:3000/api` → `/api`
- `admin.html` line ~: change `http://localhost:3000/api` → `/api`
- `blogs.html`: change `http://localhost:3000/api` → `/api`
- `blog-post.html`: change `http://localhost:3000/api` → `/api`

Or better — use a single config. Replace the API line in each file with:
```js
const API = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
```

---

## Step 4 — Swap API functions to use Supabase

Install the Supabase client:
```bash
npm install @supabase/supabase-js
```

Then in each `api/*.js` file, replace the SQLite calls with Supabase calls.
Example for `api/contact.js`:

```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, email, interest, message } = req.body;
  const { error } = await supabase.from('contacts').insert({
    id: crypto.randomUUID(), name, email, interest, message,
    ip: req.headers['x-forwarded-for'] || ''
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}
```

---

## Quick Summary

```
Local dev:   node server.js  →  http://localhost:3000
Production:  vercel deploy   →  https://your-site.vercel.app
Database:    Supabase (free Postgres, no setup needed locally)
```

Your admin dashboard will be at: `https://your-site.vercel.app/admin.html`
