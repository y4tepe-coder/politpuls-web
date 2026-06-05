"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompassMap } from "@/components/spektrum/CompassMap";
import type { SpektrumVector } from "@/lib/spektrum/types";
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
import { Flame, Trophy, Shield, Compass } from "lucide-react";

// Grobe Standort-Beschreibung aus dem 2-Achsen-Vektor. Bewusst "circa".
function positionText(v: SpektrumVector): string {
  const econ =
    v.economic < -15
      ? "wirtschaftlich eher links"
      : v.economic > 15
        ? "wirtschaftlich eher rechts"
        : "wirtschaftlich in der Mitte";
  const soc =
    v.social > 15
      ? "gesellschaftlich progressiv"
      : v.social < -15
        ? "gesellschaftlich konservativ"
        : "gesellschaftlich in der Mitte";
  return `${econ} und ${soc}`;
}

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

  const hasPlayed = state.decisions.length > 0;

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
          <div className="flex flex-col items-center gap-4">
            <CompassMap user={state.spektrum} showParties={false} />
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Du stehst{" "}
              <span className="font-semibold text-foreground">
                {positionText(state.spektrum)}
              </span>
              .
            </p>
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
