-- Politpuls: Bild-Galerie-Slot für das tägliche Dossier.
-- `images` ist ein nullable jsonb-Array (analog zu `image`): mehrere
-- themenbezogene Bilder, die im Swipe-Deck als wischbares Karussell auf der
-- Bild-Karte erscheinen — aber nur die, deren URL wirklich lädt. Das einzelne
-- `image` bleibt erhalten; die UI zeigt [...images, image] zusammen. Backward
-- compatible: bestehende Rows bleiben ohne Galerie gültig.
alter table public.dossiers
  add column if not exists images jsonb;
