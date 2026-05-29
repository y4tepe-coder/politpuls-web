"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import { partyProximity } from "@/lib/spektrum/compute";
import {
  computeCategoryScores,
  rankedPartyAlignment,
} from "@/lib/spektrum/alignment";
import { getPartyById } from "@/lib/spektrum/parties";
import { ALL_POSITIONS } from "@/lib/data/positions-catalogue";
import {
  getLocalSession,
  clearLocalSession,
  type LocalSession,
} from "@/lib/local/session";
import {
  getLocalState,
  resetLocalState,
  type LocalState,
} from "@/lib/local/state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Flame,
  Trophy,
  Shield,
  Compass,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function ProfilPage() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [state, setState] = useState<LocalState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(getLocalSession());
    setState(getLocalState());
    setHydrated(true);
  }, []);

  if (!hydrated || !state) {
    return <ProfileSkeleton />;
  }

  const matches = partyProximity(state.spektrum);
  const hasPlayed = state.decisions.length > 0;
  const positionsAnswered = Object.keys(state.positions ?? {}).length;
  const positionsTotal = ALL_POSITIONS.length;
  const werteCheckDone = positionsAnswered >= positionsTotal;
  const werteCheckStarted = positionsAnswered > 0;

  const alignedRanking = werteCheckStarted
    ? rankedPartyAlignment(state.positions)
    : null;
  const categoryScores = werteCheckStarted
    ? computeCategoryScores(state.positions)
    : null;
  const topAligned = alignedRanking?.[0];
  const topAlignedParty = topAligned ? getPartyById(topAligned.partyId) : null;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Dein Profil
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          {session?.displayName ? `Hallo, ${session.displayName}.` : "Hallo!"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {session?.isRegistered
            ? `Eingeloggt als ${session.email ?? session.displayName}.`
            : "Du spielst anonym. Spielstand läuft auf diesem Gerät."}
        </p>
      </header>

      {/* Werte-Check CTA */}
      {!werteCheckDone && (
        <section className="glass-card rounded-2xl p-5 flex flex-col gap-3">
          <header className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 text-foreground border border-foreground/10">
              <Sparkles className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                Werte-Check
              </span>
              <h2 className="font-serif text-lg font-semibold">
                {werteCheckStarted
                  ? `Weiter geht's — ${positionsTotal - positionsAnswered} Aussagen offen.`
                  : "18 Aussagen, 3 Minuten — finde deine Partei."}
              </h2>
            </div>
          </header>
          <p className="text-sm text-muted-foreground">
            Bewerte 18 konkrete politische Aussagen mit Ja, Neutral oder Nein.
          </p>
          <Link
            href="/werte-check"
            className={buttonVariants({ size: "lg" }) + " h-12 mt-1"}
          >
            {werteCheckStarted ? "Werte-Check fortsetzen" : "Werte-Check starten"}
          </Link>
        </section>
      )}

      {/* Werte-Check Ergebnis */}
      {werteCheckDone && topAlignedParty && (
        <section className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
          <header className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center size-12 rounded-2xl text-white font-semibold text-lg"
              style={{ backgroundColor: topAlignedParty.color }}
            >
              {topAlignedParty.shortName.charAt(0)}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Beste Übereinstimmung
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold leading-snug">
                {topAlignedParty.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {Math.round((topAligned?.score ?? 0) * 100)}% bei{" "}
                {positionsAnswered} Aussagen
              </span>
            </div>
          </header>
          <ul className="flex flex-col gap-2 mt-1">
            {alignedRanking?.slice(0, 7).map((r) => {
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

      {/* Category breakdown */}
      {werteCheckStarted && categoryScores && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                      Noch keine Antworten
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Kompass */}
      <section className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 text-foreground border border-foreground/10">
            <Compass className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
              Aus deinen Entscheidungen
            </span>
            <h2 className="font-serif text-xl font-semibold">
              {hasPlayed ? "Dein Kompass." : "Noch leer — spiel ein Briefing!"}
            </h2>
          </div>
        </header>
        {hasPlayed ? (
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <CompassMap user={state.spektrum} />
            <div className="w-full sm:flex-1 flex flex-col gap-3">
              <h3 className="text-sm font-medium">Drei nächste Parteien</h3>
              <PartyMatches matches={matches} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              Der Kompass entsteht aus deinen Tagesentscheidungen.
            </p>
            <Link
              href="/heute"
              className={buttonVariants({ size: "lg" }) + " h-11 px-5"}
            >
              Heute spielen
            </Link>
          </div>
        )}
      </section>

      {/* Streak */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Deine Streak
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat
            icon={<Flame className="size-4" />}
            label="Heute"
            value={`${state.current_streak}`}
            unit="Tage"
          />
          <Stat
            icon={<Trophy className="size-4" />}
            label="Bestmarke"
            value={`${state.longest_streak}`}
            unit="Tage"
          />
          <Stat
            icon={<Shield className="size-4" />}
            label="Rettung"
            value={`${state.streak_saves_left}`}
            unit="übrig"
          />
        </div>
        {state.last_briefing_date && (
          <p className="text-xs text-muted-foreground">
            Letztes Briefing: {state.last_briefing_date}
          </p>
        )}
      </section>

      {werteCheckDone && (
        <Link
          href="/werte-check"
          className="text-xs text-center text-muted-foreground hover:text-foreground underline underline-offset-4 inline-flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="size-3" />
          Werte-Check wiederholen oder anpassen
        </Link>
      )}

      <section className="flex flex-col gap-3 pt-4 border-t border-foreground/8">
        {!session?.isRegistered && (
          <Link
            href="/onboarding"
            className={buttonVariants({ size: "lg" }) + " h-12 w-full text-base"}
          >
            Konto erstellen
          </Link>
        )}
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={() => {
            if (
              confirm(
                "Spielstand wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
              )
            ) {
              resetLocalState();
              clearLocalSession();
              window.location.href = "/";
            }
          }}
        >
          Spielstand zurücksetzen
        </Button>
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-serif text-2xl font-semibold text-foreground leading-none">
        {value}
        <span className="text-sm ml-1 text-muted-foreground font-sans font-normal">
          {unit}
        </span>
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-6">
      <div className="h-10 w-2/3 rounded-md bg-foreground/5 animate-pulse" />
      <div className="h-64 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-2xl bg-foreground/5 animate-pulse" />
        <div className="h-24 rounded-2xl bg-foreground/5 animate-pulse" />
        <div className="h-24 rounded-2xl bg-foreground/5 animate-pulse" />
      </div>
    </main>
  );
}
