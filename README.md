# Addictive Learning

Live 1-on-1 quiz matches. Challenge a friend, learn together.

---

## What this is

Two players. Same questions. At the same time.  
First correct answer wins each round. Best of 7 wins the match.

AI generates fresh questions for any topic you pick — so no two matches are the same.

---

## Steps to run it

### 1. Install dependencies

```bash
cd addictive-learning
npm install
```

### 2. Add your API key

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Get a key at: https://console.anthropic.com/settings/keys  
(Free to start — you get $5 of free credits)

### 3. Run the app

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

That's it. The app works fully with just the Anthropic key.

---

## How to play (demo mode)

1. Pick a topic on the home screen
2. Click **Start a new match**
3. Wait a moment while AI generates 7 fresh questions
4. Click **Play against a simulated opponent**
5. Answer questions before the 20-second timer runs out
6. See your final score and rating change

---

## Add real multiplayer (Supabase)

The app ships with a simulated opponent for demos. To add real live multiplayer:

### Step 1 — Create a Supabase project

Go to https://supabase.com and create a free project. Wait ~2 minutes for it to set up.

### Step 2 — Run the database schema

1. Open your Supabase project → SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the editor and click **Run**

### Step 3 — Enable Realtime

1. Supabase Dashboard → Database → Replication
2. Find the `matches` table → toggle Realtime on

### Step 4 — Add Supabase keys to .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in: Supabase Dashboard → Settings → API

### Step 5 — Swap the simulated opponent

In `components/AddictiveLearning.jsx`, find the comment:

```
// SIMULATED OPPONENT — replace with Supabase Realtime for live multiplayer
```

Replace that `useEffect` block with a Supabase channel subscription:

```javascript
useEffect(() => {
  if (screen !== "battle") return;
  const channel = supabase
    .channel("match:" + matchId)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "matches",
      filter: `id=eq.${matchId}`,
    }, (payload) => {
      const m = payload.new;
      setOppScore(isPlayer1 ? m.p2_score : m.p1_score);
      setOppAns(isPlayer1 ? m.p2_last_answer !== null : m.p1_last_answer !== null);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [screen, matchId]);
```

See `supabase/schema.sql` for the full `matches` table structure.

---

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked for environment variables, add:
- `ANTHROPIC_API_KEY` — your Anthropic key
- `NEXT_PUBLIC_SUPABASE_URL` — if using real multiplayer
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — if using real multiplayer

Your app will be live at `your-project.vercel.app` in ~2 minutes.

---

## Project structure

```
addictive-learning/
├── app/
│   ├── layout.js                      # App shell, metadata
│   ├── page.js                        # Entry point
│   ├── globals.css                    # Base reset
│   └── api/generate-questions/
│       └── route.js                   # Server-side Claude API call
├── components/
│   └── AddictiveLearning.jsx          # Main app component
├── lib/
│   └── supabase-browser.js            # Supabase client helper
├── supabase/
│   └── schema.sql                     # Database schema for multiplayer
├── .env.local.example                 # Environment variable template
├── next.config.js
├── jsconfig.json
└── package.json
```

---

## Topics supported

- **How AI works** — retrieval, embeddings, hallucination (beginner friendly)
- **React** — hooks, components, state, props
- **Python** — functions, loops, data structures
- **Custom** — type any topic and the AI generates questions for it

---

## Built with

- Next.js 14 (App Router)
- Claude (Anthropic) for question generation
- Supabase for real-time multiplayer and auth
- No UI library — all custom CSS
