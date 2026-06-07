import type {
  DossierFormat,
  DossierRole,
  DossierRoleVariants,
} from "@/lib/supabase/types";

// Daily rotation of interaction patterns. `decision` stays the core learning
// beat; `meinung` (Was meinst du? + Community-Vergleich) and `faktencheck`
// (Fake-News erkennen) add variety so each day feels different. reporter-chat,
// koalition and plakat are reserved for the Wahlkampf phase and are NOT part of
// the daily rotation. The pipeline normally sets `dossier.format` explicitly;
// this is the fallback for rows (or the seed) that don't.
const ROTATION: DossierFormat[] = [
  "decision",
  "meinung",
  "decision",
  "faktencheck",
  "decision",
  "meinung",
  "faktencheck",
];

// Alle gültigen Format-Werte (auch die Wahlkampf-Formate) für Validierung.
export const DOSSIER_FORMATS: DossierFormat[] = [
  "decision",
  "reporter-chat",
  "koalition",
  "plakat",
  "meinung",
  "faktencheck",
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

// Resolve the format to actually render. Order of precedence:
//   1. role variant (V3): if a role-specific task exists for this role, its
//      format wins (e.g. opposition → meinung) — rollenabhängige Tagesaufgabe.
//   2. explicit dossier.format column.
//   3. date rotation fallback.
// `role` is optional + backward-compatible: callers without a role behave as
// before (role variants are only consulted when a role is passed).
export function resolveFormat(
  dossier: {
    format: DossierFormat | null;
    publish_date: string;
    role_variants?: DossierRoleVariants | null;
  },
  role?: DossierRole | null,
): DossierFormat {
  if (role) {
    const variantFormat = dossier.role_variants?.[role]?.format;
    if (variantFormat) return variantFormat;
  }
  return dossier.format ?? formatForDate(dossier.publish_date);
}
