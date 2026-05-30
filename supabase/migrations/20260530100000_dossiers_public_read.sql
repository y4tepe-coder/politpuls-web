-- Tages-Dossiers sind öffentlicher Nachrichten-Inhalt: Gäste (anon-Rolle,
-- lokale Sessions ohne Supabase-Login) müssen das veröffentlichte Dossier
-- lesen können — nicht nur eingeloggte Nutzer. Die ursprüngliche Policy war
-- authenticated-only und hat die News damit für den (primären) Gast-Modus
-- der App komplett versteckt.

drop policy if exists dossiers_published_read on public.dossiers;

create policy dossiers_published_read on public.dossiers
  for select
  to anon, authenticated
  using (published = true);
