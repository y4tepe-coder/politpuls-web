-- Politpuls: evergreen dossier pool. Used as fallback when the daily AI pipeline fails.
-- 14 hand-written topic-neutral dossiers (democracy basics, EU, federalism, ...) seeded separately.

create table public.evergreen_dossiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  headline text not null,
  kicker text,
  deck text,
  body jsonb not null default '[]'::jsonb,
  facts jsonb not null default '[]'::jsonb,
  glossar jsonb not null default '{}'::jsonb,
  streitfrage text,
  choices jsonb not null default '[]'::jsonb,
  consequences jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  topic_tags text[] not null default '{}',
  -- Used by publish-or-fallback to rotate (prefer dossiers not used in the last 30 days).
  last_used_date date,
  created_at timestamptz not null default now()
);

-- nulls first so unused dossiers are picked before any that have been used.
create index evergreen_rotation_idx on public.evergreen_dossiers (last_used_date asc nulls first);

alter table public.evergreen_dossiers enable row level security;
-- No public policy: service-role only.
