# OfferDesk

Job-application copilot for students and new grads, powered by the Claude API.

- **Resume**: upload a PDF once; Claude parses it into editable sections.
- **Find jobs**: live web search of employer career pages, with deadlines and fit notes.
- **Tailor & write**: tailored one-page resume PDFs (reword/reorder only — never invents), cover letters, application answers, networking notes.
- **Tracker**: every saved role with status and notes.

Users sign in with an emailed magic link. Every AI call runs on the server with your API key and is capped per user per day.

## Setup (about 15 minutes)

### 1. Supabase (database + logins)
1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → URL Configuration → set **Site URL** to your Vercel URL and add `https://YOUR-APP.vercel.app/auth/callback` to **Redirect URLs** (add `http://localhost:3000/auth/callback` for local dev).
4. Project Settings → API → copy the Project URL and the `anon` public key.

### 2. Anthropic API key
console.anthropic.com → API Keys → create one. Set a monthly spend limit under Billing.

### 3. Run locally
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

### 4. Deploy
Import the repo at vercel.com/new, add the same environment variables, deploy. Share the URL.

## Cost control
- `DAILY_AI_LIMIT` (default 25) caps parse/tailor/write calls per user per day.
- `DAILY_SEARCH_LIMIT` (default 5) caps live job searches (~$0.01 per web search plus tokens).
- `ALLOWED_EMAIL_DOMAINS` (e.g. `miamioh.edu`) restricts who can sign up.
- Rough cost: a tailor or cover letter ≈ 1–3¢ on Sonnet; a job search ≈ 5–10¢.

## Ground rules baked into the prompts
Only facts from the user's resume are used. Users review and submit every application themselves.
