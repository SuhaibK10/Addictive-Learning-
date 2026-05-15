-- ═══════════════════════════════════════════════════════════════════════
-- Addictive Learning — Multiplayer Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════

-- 1. User profiles
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url   text,
  rating       integer default 1200,
  wins         integer default 0,
  losses       integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. Match rooms (one row per live match)
create table if not exists public.matches (
  id              uuid default gen_random_uuid() primary key,
  topic           text not null,
  questions       jsonb not null,          -- AI-generated, stored once, shared
  p1_id           uuid references public.profiles,
  p2_id           uuid references public.profiles,
  p1_score        integer default 0,
  p2_score        integer default 0,
  p1_last_answer  integer,                 -- option index chosen (0-3), null = not answered
  p2_last_answer  integer,
  p1_answered_at  timestamptz,             -- for tie-breaking: earlier correct answer wins
  p2_answered_at  timestamptz,
  current_round   integer default 1,
  status          text default 'waiting',  -- waiting | active | complete
  winner_id       uuid references public.profiles,
  created_at      timestamptz default now()
);

-- 3. Matchmaking queue
create table if not exists public.matchmaking (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles not null unique,
  topic      text not null,
  rating     integer not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles    enable row level security;
alter table public.matches     enable row level security;
alter table public.matchmaking enable row level security;

-- Profiles: users can read all, write only their own
create policy "profiles_read_all"  on public.profiles for select using (true);
create policy "profiles_write_own" on public.profiles for all    using (auth.uid() = id);

-- Matches: players can read/update their own matches; anyone can read by id (for join link)
create policy "matches_read"   on public.matches for select using (true);
create policy "matches_update" on public.matches for update using (
  auth.uid() = p1_id or auth.uid() = p2_id
);
create policy "matches_insert" on public.matches for insert with check (auth.uid() = p1_id);

-- Matchmaking: users manage their own queue entry
create policy "matchmaking_own" on public.matchmaking for all using (auth.uid() = user_id);

-- ── Auto-create profile on sign up ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Player'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_matches_p1      on public.matches(p1_id);
create index if not exists idx_matches_p2      on public.matches(p2_id);
create index if not exists idx_matches_status  on public.matches(status);
create index if not exists idx_matchmaking_topic on public.matchmaking(topic, rating);

-- ── Enable Realtime for the matches table ───────────────────────────────────
-- Go to: Supabase Dashboard → Database → Replication → matches → enable
-- (cannot be done via SQL — must be done in the dashboard UI)
