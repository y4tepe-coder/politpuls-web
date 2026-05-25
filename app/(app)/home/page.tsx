"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalSession, type LocalSession } from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { PolitpulsMark } from "@/components/brand/Logo";
import { Clock, Check, Lock, Mail, FileText, UserPlus } from "lucide-react";

// Homescreen 1:1 nach iOS:
// 1. Datum-Bar oben
// 2. Tages-Entscheidung Hero (dunkel, Status-Pille, Logo rechts)
// 3. Redaktion-Banner (Clock + Countdown)
// 4. Vertikale Pfad-Knoten (groß, farbig, mit Badges + Verbindungslinie)
// 5. Gast-Hinweis ganz unten wenn anonym

const WEEKDAYS = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
const MONTHS = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];

export default function HomePage() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [state, setState] = useState<LocalState | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(getLocalSession());
    setState(getLocalState());
    setHydrated(true);
    const t = setInterval(() => setNow(new Date()), 60_000); // jede Minute Countdown updaten
    return () => clearInterval(t);
  }, []);

  if (!hydrated || !state) return <Skeleton />;

  const isGuest = !session?.isRegistered;
  const stops = buildPfadStops(now);
  const todayStop = stops.find((s) => s.status === "today") ?? stops[3];
  const playedToday = !!state.last_briefing_date;

  // Datum
  const dateLine = `${WEEKDAYS[now.getDay()]}, ${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // Countdown bis Mitternacht für "wieder frei"
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const wiederFreiIn = `${hoursLeft}h ${minutesLeft}min`;

  // Redaktion nächste Ausgabe: heute 16:00
  const next = new Date(now);
  next.setHours(16, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  const tDiff = next.getTime() - now.getTime();
  const tHours = Math.floor(tDiff / (1000 * 60 * 60));
  const tMins = Math.floor((tDiff % (1000 * 60 * 60)) / (1000 * 60));
  const isToday = next.getDate() === now.getDate();
  const editionLabel = isToday ? "Heute 16:00 Uhr" : "Morgen 16:00 Uhr";

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-6 gap-4">
      {/* Datum */}
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
        {dateLine}
      </span>

      {/* Tages-Entscheidung Hero */}
      <Link
        href="/heute"
        className="ink-card rounded-3xl p-5 flex items-stretch gap-4 group hover:opacity-95 transition-opacity"
      >
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          <h2 className="font-serif text-3xl font-bold leading-[1.05] tracking-tight">
            Tages-<br/>Entscheidung
          </h2>
          {playedToday ? (
            <>
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 px-3.5 py-1.5 text-sm font-semibold">
                <Check className="size-4" strokeWidth={3} />
                Heute geschafft
              </span>
              <span className="text-xs text-white/55 mt-1">
                Wieder frei in {wiederFreiIn}
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-gold text-gold-ink px-4 py-2 text-sm font-bold">
                Jetzt spielen →
              </span>
              <span className="text-xs text-white/55 mt-1">
                {todayStop.headline}
              </span>
            </>
          )}
        </div>
        <div className="shrink-0 size-20 rounded-2xl bg-white flex items-center justify-center self-start">
          <PolitpulsMark className="size-12 text-ink" />
        </div>
      </Link>

      {/* Redaktion-Banner */}
      <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 shrink-0">
          <Clock className="size-5 text-foreground" />
        </span>
        <div className="flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Redaktion · Nächste Ausgabe
          </span>
          <span className="text-sm font-bold text-foreground">{editionLabel}</span>
        </div>
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-mono tabular-nums text-foreground shrink-0">
          {tHours}h {tMins}m
        </span>
      </div>

      {/* Vertikale Pfad-Knoten — DAS Herzstück, iOS-Style */}
      <section className="flex flex-col items-center pt-6 pb-2">
        <ol className="relative flex flex-col items-center gap-3">
          {stops.slice(0, 5).map((stop, i) => (
            <PfadNode key={stop.date} stop={stop} index={i + 1} isLast={i === 4} />
          ))}
        </ol>
      </section>

      {/* Gast-CTA */}
      {isGuest && (
        <Link
          href="/onboarding"
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all mt-2"
        >
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-ink text-background shrink-0">
            <UserPlus className="size-4" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold leading-tight">
              Spielstand sichern
            </span>
            <span className="text-[11px] text-muted-foreground">
              Du spielst als Gast. Erstelle ein Konto für Sync.
            </span>
          </div>
        </Link>
      )}
    </main>
  );
}

function PfadNode({
  stop,
  index,
  isLast,
}: {
  stop: PfadStop;
  index: number;
  isLast: boolean;
}) {
  const isDone = stop.status === "done";
  const isToday = stop.status === "today";
  const isLocked = stop.status === "locked";

  const sizeClass = isToday ? "size-20" : "size-16";
  const bgClass = isDone
    ? "bg-emerald-300 text-white"
    : isToday
      ? "bg-gold text-gold-ink"
      : "bg-foreground/8 text-muted-foreground";

  const Inner = (
    <div className="relative flex flex-col items-center">
      <div className={`${sizeClass} rounded-full ${bgClass} flex items-center justify-center shadow-md`}>
        {isDone ? (
          <Check className="size-7" strokeWidth={3} />
        ) : isToday ? (
          <Mail className="size-7" strokeWidth={2.4} />
        ) : (
          <Lock className="size-5" />
        )}
      </div>
      {/* Numerisches Badge unten rechts */}
      <span
        className={`absolute -bottom-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px] font-bold tabular-nums px-1 ${
          isToday
            ? "bg-ink text-background"
            : isLocked
              ? "bg-foreground/15 text-muted-foreground"
              : "bg-foreground/15 text-foreground/70"
        }`}
      >
        {index}
      </span>
      {/* Wahlkampf-Pille als kleines Label für aktive Knoten */}
      {isToday && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-pp-red px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
          Wahlkampf
        </span>
      )}
    </div>
  );

  const Marker = isLocked ? (
    Inner
  ) : (
    <Link href={stop.href} className="block">
      {Inner}
    </Link>
  );

  return (
    <li className="flex flex-col items-center">
      {Marker}
      {!isLast && (
        <span aria-hidden className="w-0.5 h-6 bg-foreground/15 mt-2" />
      )}
    </li>
  );
}

function Skeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-6 gap-4">
      <div className="h-4 w-1/3 rounded bg-foreground/5 animate-pulse" />
      <div className="h-40 rounded-3xl bg-foreground/5 animate-pulse" />
      <div className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="h-64 rounded-2xl bg-foreground/5 animate-pulse mt-4" />
    </main>
  );
}

// Helper to silence unused imports
void FileText;
