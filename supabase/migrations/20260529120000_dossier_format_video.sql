-- Politpuls: modular daily formats + (future) video slot.
-- `format` lets the daily pipeline rotate the interaction pattern so each day
-- differs and the reporter chat is not shown every day. `video` is a nullable
-- slot prepared for an embeddable clip (unused for now).

-- `format` is nullable on purpose: the pipeline normally leaves it null and the
-- app rotates the pattern deterministically by date (lib/dossier/format.ts).
-- A non-null value lets us pin a specific pattern for a given day if needed.
alter table public.dossiers
  add column if not exists format text
    check (format in ('decision', 'reporter-chat', 'koalition', 'plakat')),
  add column if not exists video jsonb;
