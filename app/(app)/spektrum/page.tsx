"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import { IndicatorsCard } from "@/components/spektrum/IndicatorsCard";
import { aggregateIndicators } from "@/lib/spektrum/indicators";
import { partyProximity } from "@/lib/spektrum/compute";
import {
  computeCategoryScores,
  rankedPartyAlignment,
} from "@/lib/spektrum/alignment";
import { getPartyById } from "@/lib/spektrum/parties";
import { ALL_POSITIONS } from "@/lib/data/positions-catalogue";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buttonVariants } from "@/components/ui/button";
import { Lock, Sparkles, Compass } from "lucide-react";

// Spektrum-Page — wahl-O-mat-mäßiges Ergebnis nach 14 Tagesmissionen.
// Vorher: Lock-Screen mit Counter.
const MIN_DECISIONS = 14;

export default function SpektrumPage() {
  const [state, setState] = useState<LocalState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getLocalState());
    setHydrated(true);
  }, []);

  if (!hydrated || !state) return <SkeletonView />;

  const decisionsCount = state.decisions.length;
  const isLocked = decisionsCount < MIN_DECISIONS;
  const positionsAnswered = Object.keys(state.positions ?? {}).length;
  const werteCheckDone = positionsAnswered >= ALL_POSITIONS.length;

  if (isLocked) {
    const remaining = MIN_DECISIONS - decisionsCount;
    const pct = Math.round((decisionsCount / MIN_DECISIONS) * 100);
    const indicators = aggregateIndicators(state.decisions);
    return (
      <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-7">
        <header className="flex flex-col gap-1">
          <span className="text-on-bg text-foreground/70 text-xs font-semibold uppercase tracking-[0.22em]">
            Dein Spektrum
          </span>
          <h1 className="text-on-bg font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            Deine Bilanz als Politiker:in.
          </h1>
          <p className="text-on-bg text-sm text-foreground/75 leading-relaxed mt-1">
            Klassische Indikatoren ueber alle Tagesentscheidungen.
            Das volle Spektrum mit Parteivergleich wird nach{" "}
            {MIN_DECISIONS} Briefings freigeschaltet.
          </p>
        </header>

        {/* Indikatoren — sofort sichtbar, akkumuliert aus jeder Decision */}
        <section className="flex flex-col gap-2">
          <h2 className="text-on-bg text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Indikatoren · Deutschland 2026
          </h2>
          <IndicatorsCard indicators={indicators} decisions={state.decisions} />
        </section>

        <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-ink text-background shrink-0">
              <Lock className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Briefings gespielt
              </span>
              <span className="font-serif text-2xl font-semibold leading-tight">
                {decisionsCount} von {MIN_DECISIONS}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="h-2 rounded-full bg-foreground/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {remaining} {remaining === 1 ? "Briefing" : "Briefings"} bis zur
              Freischaltung
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Dein politisches Spektrum wird aus deinen Tagesentscheidungen
            berechnet — genau wie beim Wahl-O-Mat braucht es ein paar
            Datenpunkte, damit das Ergebnis aussagekräftig wird.
          </p>

          <Link
            href="/heute"
            className={buttonVariants({ size: "lg" }) + " h-12 mt-1"}
          >
            Heutiges Briefing spielen
          </Link>
        </section>

        {/* Werte-Check als Abkürzung */}
        {!werteCheckDone && (
          <Link
            href="/werte-check"
            className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all"
          >
            <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 shrink-0">
              <Sparkles className="size-4 text-foreground" />
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold leading-tight">
                Abkürzung: Werte-Check
              </span>
              <span className="text-xs text-muted-foreground">
                18 Aussagen — sofortiges Partei-Matching
              </span>
            </div>
          </Link>
        )}
      </main>
    );
  }

  // Unlocked view — voller Spektrum-Inhalt
  const matches = partyProximity(state.spektrum);
  const alignedRanking = werteCheckDone
    ? rankedPartyAlignment(state.positions)
    : null;
  const categoryScores = werteCheckDone
    ? computeCategoryScores(state.positions)
    : null;
  const topAligned = alignedRanking?.[0];
  const topAlignedParty = topAligned ? getPartyById(topAligned.partyId) : null;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
          Dein Politik-Spektrum
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Wo du heute stehst.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Berechnet aus {decisionsCount} Tagesentscheidungen
          {werteCheckDone ? ` + ${positionsAnswered} Werte-Check-Antworten` : ""}.
        </p>
      </header>

      {/* Best-Match Hero (wenn Werte-Check done) */}
      {topAlignedParty && (
        <section className="ink-card rounded-3xl p-5 sm:p-6 flex items-center gap-4">
          <span
            className="inline-flex items-center justify-center size-16 rounded-2xl text-white font-bold text-2xl shrink-0"
            style={{ backgroundColor: topAlignedParty.color }}
          >
            {topAlignedParty.shortName.charAt(0)}
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Beste Übereinstimmung
            </span>
            <span className="font-serif text-2xl font-semibold leading-tight">
              {topAlignedParty.name}
            </span>
            <span className="font-mono text-3xl font-bold text-gold tabular-nums leading-none mt-1">
              {Math.round((topAligned?.score ?? 0) * 100)}%
            </span>
          </div>
        </section>
      )}

      {/* Kompass */}
      <section className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 border border-foreground/10">
            <Compass className="size-5 text-foreground" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Politischer Kompass
            </span>
            <h2 className="font-serif text-lg font-semibold">
              Aus deinen Entscheidungen
            </h2>
          </div>
        </header>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <CompassMap user={state.spektrum} />
          <div className="w-full sm:flex-1 flex flex-col gap-3">
            <h3 className="text-sm font-medium">Drei nächste Parteien</h3>
            <PartyMatches matches={matches} />
          </div>
        </div>
      </section>

      {/* Themenfelder (wenn Werte-Check done) */}
      {categoryScores && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Themenfelder
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoryScores.map((c) => {
              const party = c.topPartyId ? getPartyById(c.topPartyId) : null;
              const pct = Math.round(c.topPartyScore * 100);
              return (
                <li
                  key={c.categoryId}
                  className="glass-card rounded-xl p-3 flex flex-col gap-1"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </span>
                  {c.answered > 0 ? (
                    <>
                      <span className="font-serif text-base font-semibold leading-tight">
                        {party?.shortName ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pct}% übereinstimmend
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Noch leer
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Alle 7 Parteien */}
      {alignedRanking && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Alle Parteien
          </h2>
          <ul className="glass-card rounded-2xl p-3 flex flex-col gap-2">
            {alignedRanking.map((r) => {
              const party = getPartyById(r.partyId);
              if (!party) return null;
              const pct = Math.round(r.score * 100);
              return (
                <li key={r.partyId} className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: party.color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium">
                    {party.shortName}
                  </span>
                  <div className="flex items-center gap-2 w-32 sm:w-40">
                    <div className="h-1.5 flex-1 rounded-full bg-foreground/8 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: party.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!werteCheckDone && (
        <Link
          href="/werte-check"
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all"
        >
          <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 shrink-0">
            <Sparkles className="size-4 text-foreground" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold leading-tight">
              Werte-Check vervollständigen
            </span>
            <span className="text-xs text-muted-foreground">
              Für die Themenfelder-Auswertung
            </span>
          </div>
        </Link>
      )}
    </main>
  );
}

function SkeletonView() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-6">
      <div className="h-10 w-2/3 rounded-md bg-foreground/5 animate-pulse" />
      <div className="h-48 rounded-3xl bg-foreground/5 animate-pulse" />
    </main>
  );
}
