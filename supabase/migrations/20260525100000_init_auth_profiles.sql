-- Politpuls: profiles linked 1:1 to auth.users, with anonymous-first defaults.
-- Triggers handle profile creation on signup and is_anonymous sync on upgrade.

create extension if not exists "pgcrypto";

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default true,
  -- v1 displayed compass (2 axes), -100..100
  spektrum jsonb not null default '{"economic": 0, "social": 0}'::jsonb,
  -- v1.5 raw 6-dim spectrum, stored from day one so we can upgrade UI without backfill
  spektrum_raw jsonb not null default '{"kultur": 0, "umwelt": 0, "soziales": 0, "wirtschaft": 0, "sicherheit": 0, "bildung": 0}'::jsonb,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_briefing_date date,
  streak_saves_left int not null default 1,
  difficulty text not null default 'standard' check (difficulty in ('einfach', 'standard', 'schwer')),
  -- v2 Wahlkampf reserve (unused in v1)
  role text,
  party_id text,
  xp int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- When a new auth.users row is inserted, create a matching profile.
create function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (user_id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, false))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When an anonymous user upgrades (e.g. via linkIdentity), flip is_anonymous.
create function public.handle_user_upgrade()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  if coalesce(old.is_anonymous, false) = true
     and coalesce(new.is_anonymous, false) = false then
    update public.profiles
    set is_anonymous = false
    where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_user_upgrade
  after update on auth.users
  for each row execute function public.handle_user_upgrade();
