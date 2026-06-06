-- Storage-Bucket für die KI-Erklärvideos (Remotion-Pipeline lädt <datum>.mp4
-- hierhin, die App spielt es per öffentlicher URL als Video-First-Karte).
--
-- public = true → Objekte sind über
--   <SUPABASE_URL>/storage/v1/object/public/dossier-videos/<datum>.mp4
-- ohne Auth lesbar. Geschrieben wird ausschließlich mit dem Service-Role-Key
-- (umgeht RLS), daher braucht es KEINE zusätzliche Insert-Policy.

insert into storage.buckets (id, name, public)
values ('dossier-videos', 'dossier-videos', true)
on conflict (id) do nothing;
