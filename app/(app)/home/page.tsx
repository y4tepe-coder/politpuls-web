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
          <h2 className="text-on-bg text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Dein Pfad
          </h2>
          {party && (
            <span className="text-on-bg inline-flex items-center gap-1.5 text-[11px] text-foreground/70">
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

/** Duolingo-Style-Pfad: grosse Knoten in zentrierter Mittellinie, leicht
 *  zigzag versetzt. Knoten skalieren responsiv (Mobile 64–80 px, Desktop
 *  bis 112 px). Label klein UNTER dem Knoten. Auto-Scroll zu Heute. */
function ZigzagPath({ stops }: { stops: PfadStop[] }) {
  // Beim Mount: heutigen Knoten exakt in die Viewport-Mitte scrollen.
  // Plus: kleiner "Heute"-Button blendet sich ein, wenn der User wegscrollt.
  const [showJump, setShowJump] = useState(false);

  function centerOnToday(smooth = false) {
    const el = document.getElementById("pfad-today");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Today landet ~ein Knoten-Plus-Padding unter der TopNav — vergangene
    // Knoten sind dann aus dem Bild raus, der User sieht heute + Zukunft.
    const TOP_OFFSET = 96; // px unterhalb der sticky TopNav
    const targetY = rect.top + window.scrollY - TOP_OFFSET;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: smooth ? "smooth" : ("instant" as ScrollBehavior),
    });
  }

  useEffect(() => {
    // Erst rendern lassen, dann scrollen (Layout muss fertig sein)
    const r = requestAnimationFrame(() => centerOnToday(false));

    // "Heute"-Button zeigen wenn der heutige Knoten weit weg ist — sowohl
    // wenn der User nach oben (Vergangenheit) als auch nach unten (Zukunft)
    // wegscrollt.
    function onScroll() {
      const el = document.getElementById("pfad-today");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offscreen =
        rect.bottom < 60 || rect.top > window.innerHeight - 60;
      setShowJump(offscreen);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5 Zigzag-Positionen, damit der Pfad "schlängelt" wie bei Duolingo
  const offsets = [
    "translate-x-0",
    "translate-x-[22%]",
    "translate-x-[14%]",
    "-translate-x-[14%]",
    "-translate-x-[22%]",
  ];

  return (
    <>
      <ol className="relative flex flex-col items-center gap-6 sm:gap-8 py-4">
        {stops.map((stop, i) => (
          <PfadNode
            key={stop.date + i}
            stop={stop}
            offsetClass={offsets[i % offsets.length]}
          />
        ))}
      </ol>
      {showJump && (
        <button
          type="button"
          onClick={() => centerOnToday(true)}
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-30 inline-flex items-center gap-2 rounded-full bg-gold text-gold-ink px-4 py-2.5 text-sm font-bold shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-transform"
          style={{ bottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
        >
          <Play className="size-3.5" fill="currentColor" />
          Zurück zu Heute
        </button>
      )}
    </>
  );
}

function PfadNode({
  stop,
  offsetClass,
}: {
  stop: PfadStop;
  offsetClass: string;
}) {
  const isDone = stop.status === "done";
  const isToday = stop.status === "today";
  const isEvent = !!stop.eventTag;
  const isLocked = stop.status === "locked" && !isEvent;

  // Duolingo-mässig grosse Knoten. Mobile 64 px (done/locked) bis 80 px
  // (today), Desktop bis 112 px für Today.
  const markerSize = isToday
    ? "size-20 sm:size-28"
    : isEvent
      ? "size-18 sm:size-24"
      : "size-16 sm:size-20";

  // Locked-Knoten brauchen einen opaken Wash, damit sie ueber dem Reichstag
  // erkennbar bleiben. backdrop-blur greift den Glass-Look der Cards auf.
  let markerBg =
    "bg-background/85 border border-foreground/15 backdrop-blur-sm text-foreground/55";
  let iconSize = "size-7 sm:size-9";
  let markerIcon: React.ReactNode = <Lock className={iconSize} />;
  if (isDone) {
    markerBg = "bg-emerald-500 text-white shadow-[0_6px_0_-2px] shadow-emerald-700/40";
    markerIcon = <Check className={iconSize} strokeWidth={3} />;
  } else if (isToday) {
    markerBg = "bg-gold text-gold-ink shadow-[0_8px_0_-2px] shadow-yellow-700/40";
    iconSize = "size-9 sm:size-12";
    markerIcon = <Play className={iconSize + " ml-1"} fill="currentColor" />;
  } else if (isEvent) {
    markerBg = "bg-pp-red text-white shadow-[0_6px_0_-2px] shadow-red-900/40";
    iconSize = "size-7 sm:size-9";
    if (stop.eventTag === "triell") markerIcon = <Mic className={iconSize} />;
    else if (stop.eventTag === "wahl") markerIcon = <Crown className={iconSize} />;
    else markerIcon = <Vote className={iconSize} />;
  }

  const Marker = (
    <div
      id={isToday ? "pfad-today" : undefined}
      className={`relative ${markerSize} rounded-full flex items-center justify-center shrink-0 transition-transform ${markerBg} ${
        isLocked ? "" : "hover:scale-105 active:scale-95"
      }`}
    >
      {markerIcon}
      {isEvent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-pp-red px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-sm">
          {stop.eventTag === "wahl" ? "Wahl" : stop.eventTag === "triell" ? "Triell" : "Wahlkampf"}
        </span>
      )}
    </div>
  );

  const Label = (
    <div className="flex flex-col items-center leading-tight gap-0.5 mt-2 text-center max-w-[160px] sm:max-w-[200px]">
      <span className="text-on-bg text-[10px] font-mono tabular-nums text-foreground/65">
        {stop.weekdayShort}, {stop.dayNumber}. {stop.monthShort}
      </span>
      <span
        className={`text-on-bg text-xs sm:text-sm leading-snug ${
          isToday ? "font-serif font-semibold text-foreground" : "text-foreground/85"
        } line-clamp-2`}
      >
        {stop.headline}
      </span>
    </div>
  );

  const content = (
    <div className={`flex flex-col items-center ${offsetClass} transition-transform`}>
      {Marker}
      {Label}
    </div>
  );

  if (isLocked) return <li>{content}</li>;
  return (
    <li>
      <Link href={stop.href} className="block">
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
