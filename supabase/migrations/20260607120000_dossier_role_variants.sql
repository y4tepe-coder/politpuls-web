-- V3: rollenabhängige Tagesaufgaben.
--
-- Pro Dossier kann optional eine Aufgabe je politischer Rolle hinterlegt werden
-- (opposition | minister | kanzler), als JSON, keyed nach Rolle. Die App liest
-- die Rolle des Nutzers (lokal aus der Wahl) und rendert die passende Variante;
-- fehlt das Feld oder die Rolle, greift die Basis-Interaktion des Dossiers.
--
-- Bewusst nullable + ADD COLUMN IF NOT EXISTS: abwärtskompatibel — bestehende
-- Rows bleiben NULL und verhalten sich exakt wie bisher. Kein Backfill nötig.
alter table public.dossiers
  add column if not exists role_variants jsonb;

comment on column public.dossiers.role_variants is
  'V3: per-role daily task variants, keyed by role (opposition|minister|kanzler). '
  'Each value: { format, streitfrage?, meinung?, faktencheck?, choices?, consequences? }. '
  'Nullable; the deck falls back to the base interaction when absent.';
