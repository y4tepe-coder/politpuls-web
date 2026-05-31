import { seedDossier } from "@/lib/data/seed-dossier";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import type { Dossier } from "@/lib/supabase/types";

// Berlin-date in YYYY-MM-DD. Wir nutzen sv-SE als locale, weil das standardmaessig
// ISO-Format liefert und keine deutschen Punktnotationen einbringt.
export function todayBerlinISO(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(),
  );
}

// Holt das anzuzeigende Tages-Dossier aus Supabase: das NEUESTE veröffentlichte
// Dossier mit publish_date <= heute. Ist das heutige schon generiert (ab 14:30),
// kommt das heutige; davor das jüngste vergangene (z. B. das von gestern). Erst
// wenn gar kein Dossier existiert, greift das hartcodierte seedDossier.
//
// Das ist Absicht: vorher wurde strikt nur publish_date == heute gesucht — vor
// dem 14:30-Lauf gab es also nie eine Zeile und die Seite fiel jeden Vormittag
// auf das (6 Tage alte) Beispiel-Seed zurück und sah dadurch kaputt aus. Mit
// "<= heute, neuestes zuerst" zeigt die Seite immer echten, aktuellen Inhalt.
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
// `next.revalidate` cached das Ergebnis 10 min — so ist ein um 14:30 erzeugtes
// Dossier spätestens ~14:40 live, lange vor der 16-Uhr-Ausgabe.
export async function getTodayDossier(): Promise<Dossier> {
  const date = todayBerlinISO();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/dossiers?select=*&published=eq.true&publish_date=lte.${date}&order=publish_date.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 600 },
      },
    );
    if (!res.ok) return seedDossier;
    const rows = (await res.json()) as Dossier[];
    return rows[0] ?? seedDossier;
  } catch {
    return seedDossier;
  }
}
