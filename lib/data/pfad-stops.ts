import { seedDossier } from "./seed-dossier";

// One stop on the daily path. Until the AI pipeline goes live (Tag 8+), we render
// a deterministic 7-day window around today using fake topics so the path looks alive.
// Once dossiers are in Supabase the path will read from there.
export type PfadStop = {
  date: string; // YYYY-MM-DD, Berlin date
  weekdayShort: string; // "Mo", "Di", ...
  dayNumber: number;
  monthShort: string;
  kicker: string;
  headline: string;
  status: "done" | "today" | "locked";
  href: string;
};

const WEEKDAYS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
const MONTHS_DE = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
] as const;

// Placeholder topics — replaced once we read from the dossiers table.
const PAST_TOPICS = [
  { kicker: "Sozialpolitik", headline: "Bürgergeld bleibt — wer zahlt?" },
  { kicker: "Migration", headline: "Familiennachzug: Stopp oder Reform?" },
  { kicker: "Klima", headline: "Heizungsgesetz vor dem Verfassungsgericht" },
  { kicker: "Bildung", headline: "G9 für alle? Länder uneins" },
  { kicker: "Sicherheit", headline: "Vorratsdatenspeicherung kommt zurück" },
  { kicker: "EU", headline: "Brüssels neue Asyl-Regeln in der Kritik" },
];

const FUTURE_TOPICS = [
  { kicker: "Wirtschaft", headline: "Bundeshaushalt 2027: Wer kürzt?" },
  { kicker: "Verkehr", headline: "Tempolimit auf Autobahnen?" },
  { kicker: "Renten", headline: "Riester-Reform — Großer Wurf?" },
  { kicker: "Außenpolitik", headline: "Bundeswehr-Einsatz in Mali verlängern?" },
  { kicker: "Digital", headline: "Chatkontrolle: Brüssel will durchregieren" },
  { kicker: "Wohnen", headline: "Mietendeckel auch im Bund?" },
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

// Returns 7 stops centred on today: 3 past, today, 3 future.
export function buildPfadStops(today: Date = new Date()): PfadStop[] {
  const stops: PfadStop[] = [];

  for (let offset = -3; offset <= 3; offset++) {
    const date = addDays(today, offset);
    const dateStr = formatDate(date);

    let kicker: string;
    let headline: string;
    let status: PfadStop["status"];
    let href: string;

    if (offset === 0) {
      kicker = seedDossier.kicker ?? "Heute";
      headline = seedDossier.headline;
      status = "today";
      href = "/heute";
    } else if (offset < 0) {
      const topic = PAST_TOPICS[(PAST_TOPICS.length + offset) % PAST_TOPICS.length];
      kicker = topic.kicker;
      headline = topic.headline;
      status = "done";
      href = "/heute"; // For now there's only one playable dossier.
    } else {
      const topic = FUTURE_TOPICS[(offset - 1) % FUTURE_TOPICS.length];
      kicker = topic.kicker;
      headline = topic.headline;
      status = "locked";
      href = "#";
    }

    stops.push({
      date: dateStr,
      weekdayShort: WEEKDAYS_DE[date.getDay()],
      dayNumber: date.getDate(),
      monthShort: MONTHS_DE[date.getMonth()],
      kicker,
      headline,
      status,
      href,
    });
  }

  return stops;
}
