import { seedDossier } from "./seed-dossier";

// One stop on the daily path. Mix aus täglichen Briefings + speziellen Events
// (z.B. Wahlkampf). Sobald die KI-Pipeline live ist, kommen die Dossiers aus
// Supabase und Events können in einer eigenen Tabelle kuratiert werden.
export type PfadStop = {
  date: string; // YYYY-MM-DD, Berlin date
  weekdayShort: string;
  dayNumber: number;
  monthShort: string;
  kicker: string;
  headline: string;
  // done   = vergangener Tag, gespielt
  // missed = vergangener Tag, NICHT gespielt
  // today  = heute
  // locked = Zukunft (noch nicht freigeschaltet)
  status: "done" | "missed" | "today" | "locked";
  /** Specialevent-Marker für die Pfad-Knoten (Wahlkampf, Triell etc.). */
  eventTag?: "wahlkampf" | "triell" | "wahl";
  href: string;
};

const WEEKDAYS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] as const;

const PAST_TOPICS = [
  { kicker: "Sozialpolitik", headline: "Bürgergeld bleibt — wer zahlt?" },
  { kicker: "Migration", headline: "Familiennachzug: Stopp oder Reform?" },
  { kicker: "Klima", headline: "Heizungsgesetz vor dem Verfassungsgericht" },
  { kicker: "Bildung", headline: "G9 für alle? Länder uneins" },
  { kicker: "Sicherheit", headline: "Vorratsdatenspeicherung kommt zurück" },
  { kicker: "EU", headline: "Brüssels neue Asyl-Regeln in der Kritik" },
  { kicker: "Wirtschaft", headline: "Mindestlohn auf 15 €?" },
  { kicker: "Verkehr", headline: "9-Euro-Ticket: Comeback-Debatte" },
  { kicker: "Gesundheit", headline: "Krankenhaus-Reform: Wer zahlt?" },
  { kicker: "Außenpolitik", headline: "Taurus für die Ukraine — Ja oder Nein?" },
];

const FUTURE_TOPICS = [
  { kicker: "Wirtschaft", headline: "Bundeshaushalt 2027: Wer kürzt?" },
  { kicker: "Verkehr", headline: "Tempolimit auf Autobahnen?" },
  { kicker: "Renten", headline: "Riester-Reform — Großer Wurf?" },
  { kicker: "Außenpolitik", headline: "Bundeswehr-Einsatz in Mali verlängern?" },
  { kicker: "Digital", headline: "Chatkontrolle: Brüssel will durchregieren" },
  { kicker: "Wohnen", headline: "Mietendeckel auch im Bund?" },
  { kicker: "Bildung", headline: "Digitalpakt 2.0 — was kostet das?" },
  { kicker: "Klima", headline: "Kohleausstieg auf 2030 vorziehen?" },
  { kicker: "Soziales", headline: "Vermögensteuer für Milliardäre?" },
  { kicker: "EU", headline: "EU-Erweiterung Westbalkan — wann?" },
];

// Spezial-Events, die zwischen die täglichen Briefings gestreut werden
// (relative day-offsets ab heute).
const EVENT_SCHEDULE: { offset: number; tag: "wahlkampf" | "triell" | "wahl"; kicker: string; headline: string; href: string }[] = [
  { offset: 4, tag: "wahlkampf", kicker: "Wahlkampf", headline: "Dein Wahlprogramm schreiben", href: "/wahlkampf/programm" },
  { offset: 7, tag: "wahlkampf", kicker: "Wahlkampf", headline: "Dein Plakat gestalten", href: "/wahlkampf/plakat" },
  { offset: 10, tag: "triell", kicker: "TV-Triell", headline: "Live-Studio — 5 Fragen", href: "/wahlkampf/tv-triell" },
  { offset: 13, tag: "wahl", kicker: "Wahlsonntag", headline: "Hochrechnung 18:00", href: "/wahlkampf/wahl" },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function addDays(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Wie viele vergangene Tage der Pfad nach oben zeigt (zum Hochscrollen).
const PAST_DAYS = 7;

// Liefert Stops: 7 Tage zurück + heute + 14 Tage voraus (inkl. Events).
// Reihenfolge: ältester Tag oben → Zukunft unten. Heute wird in der UI in den
// Viewport zentriert; nach OBEN scrollt man in die Vergangenheit.
// `todayInfo` ist das echte Tages-Dossier (aus Supabase via /api/today); fehlt
// es, fällt der heutige Stop auf den Seed zurück.
// `playedDates` = Menge der Tage (YYYY-MM-DD), an denen wirklich gespielt wurde.
// Daraus ergibt sich für vergangene Tage "done" (gespielt) vs "missed" (nicht).
export function buildPfadStops(
  today: Date = new Date(),
  todayInfo?: { kicker: string | null; headline: string },
  playedDates?: Set<string>,
): PfadStop[] {
  const stops: PfadStop[] = [];

  for (let offset = -PAST_DAYS; offset <= 14; offset++) {
    const date = addDays(today, offset);
    const dateStr = formatDate(date);
    const base = {
      date: dateStr,
      weekdayShort: WEEKDAYS_DE[date.getDay()],
      dayNumber: date.getDate(),
      monthShort: MONTHS_DE[date.getMonth()],
    };

    // Vergangene Tage: gespielt → done, sonst → missed. Thema aus PAST_TOPICS
    // (Platzhalter, bis ein echtes Archiv pro Datum existiert).
    if (offset < 0) {
      const topic = PAST_TOPICS[(Math.abs(offset) - 1) % PAST_TOPICS.length];
      stops.push({
        ...base,
        kicker: topic.kicker,
        headline: topic.headline,
        status: playedDates?.has(dateStr) ? "done" : "missed",
        href: "#",
      });
      continue;
    }

    // Spezial-Event an diesem (zukünftigen) Offset?
    const event = EVENT_SCHEDULE.find((e) => e.offset === offset);
    if (event) {
      stops.push({
        ...base,
        kicker: event.kicker,
        headline: event.headline,
        status: "locked",
        eventTag: event.tag,
        href: event.href,
      });
      continue;
    }

    if (offset === 0) {
      stops.push({
        ...base,
        kicker: todayInfo?.kicker ?? seedDossier.kicker ?? "Heute",
        headline: todayInfo?.headline ?? seedDossier.headline,
        status: "today",
        href: "/heute",
      });
    } else {
      const topic = FUTURE_TOPICS[(offset - 1) % FUTURE_TOPICS.length];
      stops.push({
        ...base,
        kicker: topic.kicker,
        headline: topic.headline,
        status: "locked",
        href: "#",
      });
    }
  }

  return stops;
}
