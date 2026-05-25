-- Politpuls: log of every AI pipeline run. Service-role only.
-- 'passes' captures the output of each validation pass; 'error' is set on failure.

create table public.dossier_generation_log (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in (
    'success',
    'generation_failed',
    'factcheck_failed',
    'balance_failed',
    'sources_failed',
    'no_news',
    'fallback_evergreen'
  )),
  passes jsonb not null default '{}'::jsonb,
  error text,
  dossier_id uuid references public.dossiers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index generation_log_recent_idx on public.dossier_generation_log (started_at desc);
create index generation_log_status_idx on public.dossier_generation_log (status);
