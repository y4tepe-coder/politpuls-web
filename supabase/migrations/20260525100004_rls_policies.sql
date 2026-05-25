-- Politpuls: Row-Level Security. Everything ON, then explicit policies.
-- Anonymous users have a valid auth.uid() too (just is_anonymous=true), so the same policies work.

alter table public.profiles enable row level security;
alter table public.dossiers enable row level security;
alter table public.decisions enable row level security;
alter table public.streaks enable row level security;
alter table public.dossier_generation_log enable row level security;

-- profiles: a user reads and updates their own row only.
create policy "profiles_self_select"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profiles_insert is normally handled by the on_auth_user_created trigger.
-- We still allow self-insert as a safety net for edge cases (e.g. trigger disabled in tests).
create policy "profiles_self_insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- dossiers: anyone signed in can read published rows. Writes happen via service-role only.
create policy "dossiers_published_read"
  on public.dossiers for select
  to authenticated
  using (published = true);

-- decisions: a user reads and inserts only their own rows. No updates, no deletes.
create policy "decisions_self_select"
  on public.decisions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "decisions_self_insert"
  on public.decisions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- streaks: same pattern as decisions.
create policy "streaks_self_select"
  on public.streaks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "streaks_self_insert"
  on public.streaks for insert
  to authenticated
  with check (auth.uid() = user_id);

-- dossier_generation_log: no policy = no public access. Only service-role can read/write.
