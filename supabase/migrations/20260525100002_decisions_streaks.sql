-- Politpuls: user decisions per dossier (one row per user × dossier) and the streak audit log.

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  choice_id text not null check (choice_id in ('A', 'B', 'C', 'D')),
  decided_at timestamptz not null default now(),
  spektrum_before jsonb not null,
  spektrum_after jsonb not null,
  unique (user_id, dossier_id)
);

create index decisions_user_recent_idx on public.decisions (user_id, decided_at desc);

-- Audit log: every streak event (completed | saved | broken).
-- The current/longest streak counters live on profiles; this is the historical record.
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  event text not null check (event in ('completed', 'saved', 'broken')),
  created_at timestamptz not null default now()
);

create index streaks_user_recent_idx on public.streaks (user_id, date desc);
