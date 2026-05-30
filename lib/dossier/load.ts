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
//
// Bewusst per direktem PostgREST-fetch mit dem ÖFFENTLICHEN anon-Key statt
// @supabase/supabase-js + service_role:
//   1. Veröffentlichte Tages-Dossiers sind öffentlicher Inhalt — die RLS-Policy
//      `dossiers_published_read` erlaubt anon SELECT auf published=true. Für
//      Lesen braucht es also keine Admin-Rechte (least privilege).
//   2. supabase-js crasht in der Produktion (Hostinger läuft auf Node 20) am
//      fehlenden nativen WebSocket. Genau das hat hier dazu geführt, dass die
//      Seite trotz vorhandenem Dossier immer auf das (alte) seedDossier
//      zurückfiel. fetch hat diese Abhängigkeit nicht und läuft auf jeder
//      Node-Version gleich.
// `next.revalidate` cached das Tages-Dossier 30 min — gleicher Frische-Takt wie
// die ISR auf /heute, ein neues Dossier ist also spätestens 30 min nach dem
// Upload live.
export async function getTodayDossier(): Promise<Dossier> {
  const date = todayBerlinISO();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return seedDossier;

  try {
    const res = await fetch(
      `${url}/rest/v1/dossiers?select=*&publish_date=eq.${date}&published=eq.true&limit=1`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: 1800 },
      },
    );
    if (!res.ok) return seedDossier;
    const rows = (await res.json()) as Dossier[];
    return rows[0] ?? seedDossier;
  } catch {
    return seedDossier;
  }
}
