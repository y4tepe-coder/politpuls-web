"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalSession, type LocalSession } from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { getPartyById } from "@/lib/spektrum/parties";
import { ALL_POSITIONS } from "@/lib/data/positions-catalogue";
import { PolitpulsMark } from "@/components/brand/Logo";
import {
  Play,
  Flame,
  Check,
  Lock,
  ArrowRight,
  Vote,
  Sparkles,
  UserPlus,
} from "lucide-react";

// Homescreen — iOS HomeView nachgebaut:
// 1. Datum-Bar (groß, Versalien)
// 2. Heute-Hero (Ink-Card: links Text + gold pill, rechts Logo)
// 3. Mini-Pfad (vertikal, Knoten + Verbindungslinien)
// 4. Werte-Check / Wahlkampf / Gast-Konto als Mini-Rows

const WEEKDAYS = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
const MONTHS = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];

export default function HomePage() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [state, setState] = useState<LocalState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(getLocalSession());
    setState(getLocalState());
    setHydrated(true);
  }, []);

  if (!hydrated || !state) return <HomeSkeleton />;

  const name = session?.displayName?.split(" ")[0] || "du";
  const isGuest = !session?.isRegistered;
  const stops = buildPfadStops();
  const todayStop = stops.find((s) => s.status === "today") ?? stops[3];
  const positionsAnswered = Object.keys(state.positions ?? {}).length;
  const werteCheckOpen = positionsAnswered < ALL_POSITIONS.length;
  const party = state.party_id ? getPartyById(state.party_id) : null;

  const now = new Date();
  const dateLine = `${WEEKDAYS[now.getDay()]}, ${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const playedToday = !!state.last_briefing_date;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-5 gap-5">
      {/* Datum + Gruß */}
      <header className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground tabular-nums">
          {dateLine}
        </span>
        <h1 className="font-serif text-3xl font-semibold leading-tight">
          Hallo, {name}.
        </h1>
        {party && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: party.color }}
              aria-hidden
            />
            Du trittst als {party.shortName} an
          </span>
        )}
      </header>

      {/* Heute-Hero — Ink-Card iOS-Style */}
      <Link
        href="/heute"
        className="ink-card rounded-3xl p-5 sm:p-6 flex items-stretch gap-4 group hover:opacity-95 transition-opacity"
      >
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Heutige Mission
            </span>
            {playedToday && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white/70">
                <Check className="size-3" /> gespielt
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/55">
              {todayStop.kicker}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold leading-tight">
              {todayStop.headline}
            </h2>
          </div>
          <span className="inline-flex items-center justify-center self-start mt-1 rounded-full bg-gold text-gold-ink px-5 py-2.5 text-sm font-semibold gap-2 group-hover:scale-[1.02] transition-transform">
            <Play className="size-3.5" fill="currentColor" />
            {playedToday ? "Briefing nochmal" : "Jetzt spielen"}
          </span>
        </div>
        <div className="hidden sm:flex shrink-0 size-24 rounded-2xl bg-white/8 items-center justify-center self-center">
          <PolitpulsMark className="size-14 text-white" />
        </div>
      </Link>

      {/* Streak — nur wenn > 0, sehr clean */}
      {state.current_streak > 0 && (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <Flame className="size-6 text-pp-red shrink-0" fill="currentColor" />
          <span className="flex-1 font-serif text-xl font-semibold leading-none">
            {state.current_streak}
            <span className="text-sm text-muted-foreground font-sans font-normal ml-1.5">
              {state.current_streak === 1 ? "Tag in Folge" : "Tage in Folge"}
            </span>
          </span>
          {state.longest_streak > state.current_streak && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Best: {state.longest_streak}
            </span>
          )}
        </div>
      )}

      {/* Mini-Pfad — vertikal mit Verbindungslinien */}
      <section className="flex flex-col gap-2">
        <header className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Dein Pfad
          </h2>
          <Link
            href="/pfad"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Alle <ArrowRight className="size-3" />
          </Link>
        </header>
        <div className="relative pl-6">
          {/* Vertikale Linie */}
          <span
            aria-hidden
            className="absolute left-[10px] top-2 bottom-2 w-px bg-foreground/15"
          />
          <ul className="flex flex-col gap-1.5">
            {stops.slice(0, 5).map((stop) => (
              <PfadMiniRow key={stop.date} stop={stop} />
            ))}
          </ul>
        </div>
      </section>

      {/* Gast → Konto-CTA */}
      {isGuest && (
        <Link
          href="/onboarding"
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all"
        >
          <span className="inline-flex items-center justify-center size-9 rounded-full bg-ink text-background shrink-0">
            <UserPlus className="size-4" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold leading-tight">
              Spielstand sichern
            </span>
            <span className="text-[11px] text-muted-foreground">
              Du spielst als Gast. Konto erstellen für Sync.
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {/* Werte-Check */}
      {werteCheckOpen && (
        <Link
          href="/werte-check"
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all"
        >
          <span className="inline-flex items-center justify-center size-9 rounded-full bg-foreground/5 shrink-0">
            <Sparkles className="size-4 text-foreground" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold leading-tight">
              {positionsAnswered === 0
                ? "Werte-Check starten"
                : `Werte-Check fortsetzen`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              18 Aussagen — finde deine Partei
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {/* Wahlkampf */}
      <Link
        href="/wahlkampf"
        className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all"
      >
        <span className="inline-flex items-center justify-center size-9 rounded-full bg-foreground/5 shrink-0">
          <Vote className="size-4 text-foreground" />
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold leading-tight">
            So läuft ein Wahlkampf
          </span>
          <span className="text-[11px] text-muted-foreground">
            6 Schritte bis zur Kanzlerschaft
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
      </Link>
    </main>
  );
}

function PfadMiniRow({ stop }: { stop: PfadStop }) {
  const isToday = stop.status === "today";
  const isDone = stop.status === "done";
  const isLocked = stop.status === "locked";

  const Marker = (
    <span
      className={`absolute -left-6 top-1.5 inline-flex items-center justify-center rounded-full ${
        isToday
          ? "size-5 bg-gold text-gold-ink ring-2 ring-gold/30"
          : isDone
            ? "size-4 bg-foreground/15 text-foreground/60"
            : "size-4 bg-foreground/5 text-muted-foreground"
      }`}
      style={{ left: "-1.5rem" }}
    >
      {isDone ? (
        <Check className="size-2.5" strokeWidth={3} />
      ) : isToday ? (
        <Play className="size-2.5 ml-0.5" fill="currentColor" />
      ) : (
        <Lock className="size-2.5" />
      )}
    </span>
  );

  const Inner = (
    <div className="relative flex items-baseline gap-3 py-1.5">
      {Marker}
      <span className="text-[10px] font-mono tabular-nums w-12 shrink-0 text-muted-foreground">
        {stop.weekdayShort} {stop.dayNumber}.
      </span>
      <span
        className={`text-sm leading-snug flex-1 truncate ${
          isToday
            ? "font-serif font-semibold text-foreground"
            : isLocked
              ? "text-muted-foreground"
              : "text-foreground/80"
        }`}
      >
        {stop.headline}
      </span>
    </div>
  );

  if (isLocked) return <li>{Inner}</li>;
  return (
    <li>
      <Link
        href={stop.href}
        className="block rounded-md hover:bg-foreground/[0.03] transition-colors"
      >
        {Inner}
      </Link>
    </li>
  );
}

function HomeSkeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-5 gap-5">
      <div className="h-8 w-1/3 rounded-md bg-foreground/5 animate-pulse" />
      <div className="h-48 rounded-3xl bg-foreground/5 animate-pulse" />
      <div className="h-32 rounded-2xl bg-foreground/5 animate-pulse" />
    </main>
  );
}
