"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import { partyProximity } from "@/lib/spektrum/compute";
import {
  getLocalSession,
  clearLocalSession,
  type LocalSession,
} from "@/lib/local/session";
import { getLocalState, resetLocalState, type LocalState } from "@/lib/local/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Flame, Trophy, Shield, Compass, Sparkles } from "lucide-react";

// Profile page — reads from local state by default, works offline.
// When Supabase is wired we'll also hydrate from the server profile here.
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

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
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

      <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-xl bg-accent/15 text-accent">
            <Compass className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
              Dein politischer Kompass
            </span>
            <h2 className="font-serif text-xl font-semibold">
              {hasPlayed ? "Wo du heute stehst." : "Spiel das erste Briefing!"}
            </h2>
          </div>
        </header>
        {hasPlayed ? (
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <CompassMap user={state.spektrum} />
            <div className="w-full sm:flex-1 flex flex-col gap-3">
              <h3 className="text-sm font-medium">Deine drei nächsten Parteien</h3>
              <PartyMatches matches={matches} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Sparkles className="size-8 text-accent" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Dein Kompass entsteht, sobald du das tägliche Briefing gespielt
              hast. Jede Entscheidung verschiebt deinen Punkt zwischen den
              Parteien.
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

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Deine Streak
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat
            tone="accent"
            icon={<Flame className="size-4" />}
            label="Heute"
            value={`${state.current_streak}`}
            unit="Tage"
          />
          <Stat
            tone="success"
            icon={<Trophy className="size-4" />}
            label="Bestmarke"
            value={`${state.longest_streak}`}
            unit="Tage"
          />
          <Stat
            tone="primary"
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

      <section className="flex flex-col gap-3 pt-4 border-t border-border">
        {!session?.isRegistered && (
          <Link
            href="/registrieren"
            className={buttonVariants({ size: "lg" }) + " h-12 w-full text-base"}
          >
            Spielstand auf E-Mail sichern
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
  tone,
  icon,
  label,
  value,
  unit,
}: {
  tone: "accent" | "success" | "primary";
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  const styles = {
    accent: "bg-accent/15 border-accent/30 text-accent-foreground/90",
    success: "bg-success/15 border-success/30 text-success",
    primary: "bg-primary/10 border-primary/25 text-primary",
  } as const;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${styles[tone]}`}>
      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
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
      <div className="h-10 w-2/3 rounded-md bg-muted animate-pulse" />
      <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      </div>
    </main>
  );
}
