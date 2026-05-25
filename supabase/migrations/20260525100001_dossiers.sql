-- Politpuls: daily dossiers, written by the AI pipeline.
-- One published row per day in Berlin time. Provenance columns let us audit how each was made.

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null unique,
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
  -- Provenance
  sources jsonb not null default '[]'::jsonb,
  model_version text,
  prompt_version text,
  generation_log_id uuid,
  factcheck_passed boolean not null default false,
  balance_score float,
  -- Publishing
  published boolean not null default false,
  published_at timestamptz,
  -- v2 Wahlkampf reserve
  topic_tags text[] not null default '{}',
  phase text not null default 'daily' check (phase in ('daily', 'wahlkampf')),
  created_at timestamptz not null default now()
);

create index dossiers_publish_date_idx on public.dossiers (publish_date desc);
create index dossiers_published_idx on public.dossiers (published) where published = true;
create index dossiers_phase_idx on public.dossiers (phase);
