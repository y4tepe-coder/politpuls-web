"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getLocalSession, type LocalSession } from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { seedDossier } from "@/lib/data/seed-dossier";
import { getPartyById } from "@/lib/spektrum/parties";
import { ALL_POSITIONS } from "@/lib/data/positions-catalogue";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Play,
  Flame,
  ArrowRight,
  Sparkles,
  Vote,
  Check,
  Lock,
} from "lucide-react";

// iOS-style Homescreen — Greeting, heutige Mission als Hero, Pfad-Vorschau,
// Streak, Wahlkampf-Status, Werte-Check CTA. Kein direktes Reinschubsen ins
// Briefing — der User wählt selbst, wann er heute spielt.

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
  const stops = buildPfadStops();
  const todayStop = stops.find((s) => s.status === "today") ?? stops[3];
  const nextStops = stops.slice(0, 5);
  const positionsAnswered = Object.keys(state.positions ?? {}).length;
  const werteCheckOpen = positionsAnswered < ALL_POSITIONS.length;
  const party = state.party_id ? getPartyById(state.party_id) : null;
  const wahlkampfStarted =
    (state.campaign_themen?.length ?? 0) > 0 ||
    !!state.campaign_plakat ||
    Object.keys(state.campaign_triell_answers ?? {}).length > 0;

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Guten Morgen"
      : now.getHours() < 18
        ? "Hallo"
        : "Guten Abend";

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
      {/* Greeting + party badge */}
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
          {greeting}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          {name}.
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

      {/* Heutige Mission — Hero Card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4"
      >
        <header className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            Heutige Mission
          </span>
          {state.last_briefing_date && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              <Check className="size-3" /> bereits gespielt
            </span>
          )}
        </header>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
            {todayStop.kicker}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold leading-snug">
            {todayStop.headline}
          </h2>
        </div>
        <Link
          href="/heute"
          className={
            buttonVariants({ size: "lg" }) +
            " h-12 mt-1 group inline-flex items-center justify-center"
          }
        >
          <Play className="size-4 mr-2" fill="currentColor" />
          {state.last_briefing_date ? "Briefing nochmal" : "Jetzt spielen"}
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.section>

      {/* Streak */}
      {state.current_streak > 0 && (
        <section className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <span className="inline-flex items-center justify-center size-12 rounded-xl bg-foreground/5 border border-foreground/10">
            <Flame className="size-6 text-orange-500" fill="currentColor" />
          </span>
          <div className="flex flex-col flex-1">
            <span className="font-serif text-2xl font-semibold leading-none">
              {state.current_streak}{" "}
              <span className="text-sm text-muted-foreground font-sans font-normal">
                {state.current_streak === 1 ? "Tag" : "Tage"} in Folge
              </span>
            </span>
            {state.longest_streak > state.current_streak && (
              <span className="text-xs text-muted-foreground mt-0.5">
                Bestmarke: {state.longest_streak} Tage
              </span>
            )}
          </div>
        </section>
      )}

      {/* Pfad-Vorschau */}
      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Dein Pfad
          </h2>
          <Link
            href="/pfad"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Alle <ArrowRight className="size-3" />
          </Link>
        </header>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 snap-x">
          {nextStops.map((stop) => (
            <PfadMiniStop key={stop.date} stop={stop} />
          ))}
        </div>
      </section>

      {/* Werte-Check CTA */}
      {werteCheckOpen && (
        <Link
          href="/werte-check"
          className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-foreground/5 transition-all"
        >
          <span className="inline-flex items-center justify-center size-11 rounded-xl bg-foreground/5 border border-foreground/10 shrink-0">
            <Sparkles className="size-5 text-foreground" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-serif font-semibold leading-tight">
              {positionsAnswered === 0
                ? "Werte-Check starten"
                : `Werte-Check fortsetzen (${ALL_POSITIONS.length - positionsAnswered} offen)`}
            </span>
            <span className="text-xs text-muted-foreground">
              18 Aussagen — finde, welche Partei wirklich zu dir passt
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {/* Wahlkampf-Status */}
      <Link
        href="/wahlkampf"
        className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-foreground/5 transition-all"
      >
        <span className="inline-flex items-center justify-center size-11 rounded-xl bg-foreground/5 border border-foreground/10 shrink-0">
          <Vote className="size-5 text-foreground" />
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-serif font-semibold leading-tight">
            {wahlkampfStarted
              ? "Wahlkampf-Modus fortsetzen"
              : "Wahlkampf starten"}
          </span>
          <span className="text-xs text-muted-foreground">
            {wahlkampfStarted
              ? "Programm, Plakat, TV-Triell oder Wahl"
              : "4 Schritte bis zur Kanzlerschaft"}
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
      </Link>
    </main>
  );
}

function PfadMiniStop({ stop }: { stop: PfadStop }) {
  const Inner = (
    <div className="flex flex-col items-center gap-2 min-w-[64px] snap-start">
      <span
        className={`relative inline-flex items-center justify-center size-12 rounded-full ${
          stop.status === "today"
            ? "bg-foreground text-background ring-4 ring-accent/30"
            : stop.status === "done"
              ? "bg-foreground/10 text-foreground ring-2 ring-foreground/15"
              : "bg-foreground/5 text-muted-foreground"
        }`}
      >
        {stop.status === "today" && (
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        )}
        {stop.status === "done" ? (
          <Check className="size-5 relative" strokeWidth={3} />
        ) : stop.status === "today" ? (
          <Play className="size-4 ml-0.5 relative" fill="currentColor" />
        ) : (
          <Lock className="size-4" />
        )}
      </span>
      <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
        {stop.weekdayShort}
        <br />
        {stop.dayNumber}
      </span>
    </div>
  );
  if (stop.status === "locked") return Inner;
  return (
    <Link href={stop.href} className="block">
      {Inner}
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
      <div className="h-10 w-1/3 rounded-md bg-foreground/5 animate-pulse" />
      <div className="h-48 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
    </main>
  );
}

// Use the seed dossier as today's mission preview when no live data yet
void seedDossier;
