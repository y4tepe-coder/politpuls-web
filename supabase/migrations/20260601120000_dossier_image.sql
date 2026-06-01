-- Politpuls: Artikel-Bild-Slot für das tägliche Dossier.
-- `image` ist ein nullable jsonb-Slot (analog zu `video`): ein themenbezogenes
-- Bild ("Zeitungsartikel"-Vorschau / Pressefoto), das im Swipe-Deck als eigene
-- Karte erscheint — aber nur, wenn die Redaktion eine URL liefert. Backward
-- compatible: bestehende Rows bleiben ohne Bild gültig.
alter table public.dossiers
  add column if not exists image jsonb;
