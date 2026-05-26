import { createClient } from "@/lib/supabase/server";
import { seedDossier } from "@/lib/data/seed-dossier";
import type { Dossier } from "@/lib/supabase/types";

// Berlin-date in YYYY-MM-DD. Wir nutzen sv-SE als locale, weil das standardmaessig
// ISO-Format liefert und keine deutschen Punktnotationen einbringt.
export function todayBerlinISO(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(),
  );
}

// Fetches today's published dossier from Supabase. Wenn keins live ist
// (Pipeline noch nicht durch, oder Fallback noch nicht geschrieben), zeigen
// wir das seedDossier — damit die Seite nie kaputt aussieht.
export async function getTodayDossier(): Promise<Dossier> {
  const date = todayBerlinISO();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dossiers")
      .select("*")
      .eq("publish_date", date)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return seedDossier;
    return data as Dossier;
  } catch {
    return seedDossier;
  }
}
