"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalSession, type LocalSession } from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { getPartyById } from "@/lib/spektrum/parties";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Clock,
  Check,
  Lock,
  Play,
  Vote,
  Mic,
  Crown,
  UserPlus,
  ArrowRight,
} from "lucide-react";

// Clean iOS-Homescreen — minimal, scrollbar:
// 1. Datum
// 2. Heute-Hero (konkretes Briefing-Thema, kein "Tages-Entscheidung"-Wording)
// 3. Redaktion-Banner (Clock + Countdown)
// 4. Versetzter, scrollbarer Pfad (Vergangenheit oben → Zukunft unten)
//    inkl. Events (Wahlkampf, Triell, Wahl) zwischen den Tagen
// 5. Gast-CTA wenn anonym

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
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated || !state) return <Skeleton />;

  const isGuest = !session?.isRegistered;
  const stops = buildPfadStops(now);
  const todayStop = stops.find((s) => s.status === "today") ?? stops[7];
  const playedToday = !!state.last_briefing_date;
  const party = state.party_id ? getPartyById(state.party_id) : null;

  const dateLine = `${WEEKDAYS[now.getDay()]}, ${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // Redaktion-Countdown: nächste Ausgabe 16:00 Uhr
  const next = new Date(now);
  next.setHours(16, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  const tDiff = next.getTime() - now.getTime();
  const tHours = Math.floor(tDiff / (1000 * 60 * 60));
  const tMins = Math.floor((tDiff % (1000 * 60 * 60)) / (1000 * 60));
  const editionLabel = next.getDate() === now.getDate() ? "Heute 16:00 Uhr" : "Morgen 16:00 Uhr";

  // Past/Future-Anker: User soll bei Aufruf auf Heute landen, kann hoch+runter
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-12 gap-4">
      {/* Datum */}
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
        {dateLine}
      </span>

      {/* Heute-Hero (konkretes Briefing-Thema) */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.22em]">
            Heute
          </span>
          {playedToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold">
              <Check className="size-3" strokeWidth={3} />
              gespielt
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {todayStop.kicker}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            {todayStop.headline}
          </h1>
        </div>
        <Link
          href="/heute"
          className={
            buttonVariants({ size: "lg" }) +
            " h-12 group self-stretch inline-flex items-center justify-center"
          }
        >
          <Play className="size-4 mr-2" fill="currentColor" />
          {playedToday ? "Briefing nochmal" : "Jetzt spielen"}
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>

      {/* Redaktion-Banner */}
      <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 shrink-0">
          <Clock className="size-5 text-foreground" />
        </span>
        <div className="flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Redaktion · Nächste Ausgabe
          </span>
          <span className="text-sm font-semibold text-foreground">{editionLabel}</span>
        </div>
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-mono tabular-nums text-foreground shrink-0">
          {tHours}h {tMins}m
        </span>
      </div>

      {/* Versetzter, scrollbarer Pfad */}
      <section className="flex flex-col mt-2">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Dein Pfad
          </h2>
          {party && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: party.color }}
                aria-hidden
              />
              {party.shortName}
            </span>
          )}
        </header>
        <ZigzagPath stops={stops} />
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
              Du spielst als Gast — Konto erstellen für Sync.
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}
    </main>
  );
}

/** Versetzte Zigzag-Path-Darstellung. Heute wird mit ref-id versehen damit
 *  der User initial dort landet, aber komplett scrollbar (oben Vergangenheit,
 *  unten Zukunft inkl. Events wie Wahlkampf/Triell/Wahl). */
function ZigzagPath({ stops }: { stops: PfadStop[] }) {
  // Anker beim ersten Render: zum heutigen Knoten scrollen
  useEffect(() => {
    const el = document.getElementById("pfad-today");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ol className="relative flex flex-col gap-3">
      {/* Vertikale Mittel-Linie */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-px top-4 bottom-4 w-px bg-foreground/15"
      />
      {stops.map((stop, i) => (
        <PfadRow key={stop.date + i} stop={stop} side={i % 2 === 0 ? "left" : "right"} />
      ))}
    </ol>
  );
}

function PfadRow({ stop, side }: { stop: PfadStop; side: "left" | "right" }) {
  const isDone = stop.status === "done";
  const isToday = stop.status === "today";
  const isEvent = !!stop.eventTag;

  // Marker
  const markerSize = isToday ? "size-16" : isEvent ? "size-14" : "size-12";
  let markerBg = "bg-foreground/8 text-muted-foreground";
  let markerIcon: React.ReactNode = <Lock className="size-4" />;
  if (isDone) {
    markerBg = "bg-emerald-500 text-white";
    markerIcon = <Check className="size-5" strokeWidth={3} />;
  } else if (isToday) {
    markerBg = "bg-gold text-gold-ink";
    markerIcon = <Play className="size-5 ml-0.5" fill="currentColor" />;
  } else if (isEvent) {
    markerBg = "bg-pp-red/15 text-pp-red border border-pp-red/30";
    if (stop.eventTag === "triell") markerIcon = <Mic className="size-5" />;
    else if (stop.eventTag === "wahl") markerIcon = <Crown className="size-5" />;
    else markerIcon = <Vote className="size-5" />;
  }

  const Marker = (
    <div
      id={isToday ? "pfad-today" : undefined}
      className={`relative ${markerSize} rounded-full flex items-center justify-center shadow-sm shrink-0 ${markerBg}`}
    >
      {markerIcon}
      {isEvent && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-pp-red px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
          {stop.eventTag === "wahl" ? "Wahl" : stop.eventTag === "triell" ? "Triell" : "Wahlkampf"}
        </span>
      )}
    </div>
  );

  const Label = (
    <div
      className={`flex flex-col leading-tight gap-0.5 max-w-[60%] ${
        side === "left" ? "items-end text-right pr-1" : "items-start text-left pl-1"
      } ${stop.status === "locked" && !isEvent ? "opacity-60" : ""}`}
    >
      <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
        {stop.weekdayShort}, {stop.dayNumber}. {stop.monthShort}
      </span>
      <span
        className={`text-sm leading-snug truncate w-full ${
          isToday
            ? "font-serif font-semibold text-foreground"
            : "text-foreground/80"
        }`}
      >
        {stop.headline}
      </span>
      <span className="text-[10px] text-muted-foreground">{stop.kicker}</span>
    </div>
  );

  const content = (
    <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
      {side === "left" ? Label : <span />}
      {Marker}
      {side === "right" ? Label : <span />}
    </div>
  );

  if (stop.status === "locked" && !isEvent) {
    return <li>{content}</li>;
  }
  return (
    <li>
      <Link
        href={stop.href}
        className="block rounded-2xl hover:bg-foreground/[0.02] transition-colors"
      >
        {content}
      </Link>
    </li>
  );
}

function Skeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-6 gap-4">
      <div className="h-4 w-1/3 rounded bg-foreground/5 animate-pulse" />
      <div className="h-44 rounded-3xl bg-foreground/5 animate-pulse" />
      <div className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="h-96 rounded-2xl bg-foreground/5 animate-pulse mt-4" />
    </main>
  );
}
