-- Zwei neue spielerische Tagesformate fürs Web-Quiz + echtes Community-Voting.
-- (Wurde am 2026-06-02 bereits direkt auf der Prod-DB angewandt; diese Datei
-- hält das Repo damit in Sync.)

-- 1) Neue Tagesformate erlauben (meinung = "Was meinst du?", faktencheck = Fake-News-Check)
alter table public.dossiers drop constraint if exists dossiers_format_check;
alter table public.dossiers add constraint dossiers_format_check
  check (
    format is null
    or format = any (array['decision','reporter-chat','koalition','plakat','meinung','faktencheck'])
  );

-- 2) Format-spezifische Nutzdaten als nullable jsonb (alte Zeilen + Seed bleiben gültig)
alter table public.dossiers add column if not exists meinung jsonb;
alter table public.dossiers add column if not exists faktencheck jsonb;

-- 3) Stimmen fürs "Was meinst du?"-Voting. Schlüssel ist publish_date (pro Tag
--    genau ein Dossier). Eine Stimme pro Gerät/voter_id und Tag.
create table if not exists public.dossier_votes (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null,
  option_id text not null,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (publish_date, voter_id)
);

create index if not exists dossier_votes_date_idx on public.dossier_votes (publish_date);

-- RLS an, aber KEINE Direkt-Policies: jeglicher Zugriff läuft ausschließlich
-- über die SECURITY-DEFINER-Funktionen unten. So sieht/ändert der anon-Client
-- keine Roh-Stimmen und kann nur sauber abstimmen.
alter table public.dossier_votes enable row level security;

-- 4) Aktuelle Auszählung für einen Tag + (optional) die eigene Wahl des voters.
create or replace function public.meinung_tally(p_date date, p_voter text default null)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', coalesce((select count(*) from dossier_votes where publish_date = p_date), 0),
    'options', coalesce((
      select jsonb_agg(jsonb_build_object('option_id', option_id, 'votes', n) order by option_id)
      from (
        select option_id, count(*)::int as n
        from dossier_votes
        where publish_date = p_date
        group by option_id
      ) t
    ), '[]'::jsonb),
    'my_choice', (
      select option_id from dossier_votes
      where publish_date = p_date and p_voter is not null and voter_id = p_voter
      limit 1
    )
  );
$$;

-- 5) Abstimmen (idempotent: eine Stimme pro Gerät/Tag, kein Ändern) und frische
--    Auszählung zurückgeben.
create or replace function public.meinung_vote(p_date date, p_option text, p_voter text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_option is null or char_length(p_option) > 20
     or p_voter is null or char_length(p_voter) not between 1 and 100 then
    raise exception 'ungueltige Stimme';
  end if;

  insert into public.dossier_votes (publish_date, option_id, voter_id)
  values (p_date, p_option, p_voter)
  on conflict (publish_date, voter_id) do nothing;

  return public.meinung_tally(p_date, p_voter);
end;
$$;

-- Nur die Funktionen sind öffentlich aufrufbar (über den anon-Key / PostgREST).
grant execute on function public.meinung_tally(date, text) to anon, authenticated;
grant execute on function public.meinung_vote(date, text, text) to anon, authenticated;
