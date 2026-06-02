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

// Freischalt-Datum fuer die Tages-Ausgabe. Die neue Ausgabe wird taeglich um
// 10:00 Berliner Zeit freigeschaltet — VOR 10:00 gilt die heutige Zeile als
// noch nicht veroeffentlicht, dann wird die juengste vorherige (i.d.R. gestern)
// gezeigt. So stimmt der "Naechste Ausgabe Heute 10:00 Uhr"-Countdown auf der
// Startseite mit dem tatsaechlich sichtbaren Inhalt ueberein. Der Redaktions-
// Cron generiert frueh am Morgen (05:00 UTC) mit Puffer, das Gate haelt die
// fertige Ausgabe bis 10:00 zurueck.
function releasedMaxBerlinDate(): string {
  const today = todayBerlinISO();
  const berlinHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  if (berlinHour >= 10) return today;
  // Vor 10:00: heutige Ausgabe noch gesperrt -> gestern (Berliner Datum).
  // Reine Datums-Arithmetik in UTC, damit Sommer-/Winterzeit egal ist.
  const [y, m, d] = today.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return prev.toISOString().slice(0, 10);
}

// Holt das anzuzeigende Tages-Dossier aus Supabase: das NEUESTE veröffentlichte
// Dossier mit publish_date <= Freischalt-Datum (siehe releasedMaxBerlinDate:
// die heutige Ausgabe zählt erst ab 10:00 Berliner Zeit). Davor das jüngste
// vergangene (z. B. das von gestern). Erst wenn gar kein Dossier existiert,
// greift das hartcodierte seedDossier.
//
// Das ist Absicht: vorher wurde strikt nur publish_date == heute gesucht — vor
// dem Redaktions-Lauf gab es also nie eine Zeile und die Seite fiel jeden
// Vormittag auf das (alte) Beispiel-Seed zurück und sah dadurch kaputt aus. Mit
// "<= Freischalt-Datum, neuestes zuerst" zeigt die Seite immer echten Inhalt.
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
// `next.revalidate` cached das Ergebnis 10 min. Hinweis: dadurch kann die um
// 10:00 freigeschaltete Ausgabe bis zu ~10 min später live gehen (bis der Cache
// dreht) — bewusst in Kauf genommen für die Entlastung von Supabase.
export async function getTodayDossier(): Promise<Dossier> {
  const date = releasedMaxBerlinDate();

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
