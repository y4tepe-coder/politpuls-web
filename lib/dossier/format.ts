import type { DossierFormat } from "@/lib/supabase/types";

// Daily rotation of interaction patterns. `decision` dominates (it's the core
// learning beat); reporter-chat, koalition and plakat are sprinkled in so each
// day feels different and the chat is NOT shown every day. Mirrors the idea of
// iOS `Wahlkampf.dailyFor`. The pipeline normally sets `dossier.format`
// explicitly; this is the fallback for rows (or the seed) that don't.
const ROTATION: DossierFormat[] = [
  "decision",
  "reporter-chat",
  "decision",
  "koalition",
  "decision",
  "plakat",
  "reporter-chat",
];

export const DOSSIER_FORMATS: DossierFormat[] = [
  "decision",
  "reporter-chat",
  "koalition",
  "plakat",
];

export function isDossierFormat(value: unknown): value is DossierFormat {
  return (
    typeof value === "string" &&
    (DOSSIER_FORMATS as string[]).includes(value)
  );
}

// Stable per-day index from the ISO date (YYYY-MM-DD), independent of timezone.
export function formatForDate(isoDate: string): DossierFormat {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(ms)) return "decision";
  const day = Math.floor(ms / 86_400_000);
  const idx = ((day % ROTATION.length) + ROTATION.length) % ROTATION.length;
  return ROTATION[idx];
}

// Resolve the format to actually render: explicit column wins, else rotate.
export function resolveFormat(dossier: {
  format: DossierFormat | null;
  publish_date: string;
}): DossierFormat {
  return dossier.format ?? formatForDate(dossier.publish_date);
}
