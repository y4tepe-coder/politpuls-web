"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { IndicatorsCard } from "@/components/spektrum/IndicatorsCard";
import { aggregateIndicators } from "@/lib/spektrum/indicators";
import { getLocalState, type LocalState, type LocalRole } from "@/lib/local/state";
import type { SpektrumVector } from "@/lib/spektrum/types";
import { buttonVariants } from "@/components/ui/button";
import { Users, Landmark, Lock, Compass } from "lucide-react";

// Spektrum-Page — der "Simulator-Spiegel".
//   Modul 1  Bevölkerung   → wie kommen deine Entscheidungen an (Opposition, immer offen)
//   Modul 2  Deutschland   → wie verändern sie das Land (nur als Minister/Kanzler)
//   Modul 3  Kompass       → wo du circa stehst, erst nach den 14 Tagesentscheidungen
//
// Der Indikator "Beliebtheit" gehört zur Bevölkerung (Modul 1), alle übrigen
// KPIs zum Regierungs-Modul (Modul 2).
const COMPASS_MIN_DECISIONS = 14;
const POPULARITY_LABEL = "Beliebtheit";

function roleLabel(role: LocalRole): string {
  if (role === "kanzler") return "Bundeskanzler";
  if (role === "minister") return "Minister";
  return "Opposition";
}

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

export default function SpektrumPage() {
  const [state, setState] = useState<LocalState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(getLocalState());
    setHydrated(true);
  }, []);

  if (!hydrated || !state) return <SkeletonView />;

  const decisionsCount = state.decisions.length;
  const isGoverning = state.role === "minister" || state.role === "kanzler";
  const compassReady = decisionsCount >= COMPASS_MIN_DECISIONS;

  const indicators = aggregateIndicators(state.decisions);
  const popularity = indicators.filter((i) => i.label === POPULARITY_LABEL);
  const germany = indicators.filter((i) => i.label !== POPULARITY_LABEL);

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-7">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
          Dein Spektrum
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Wo du heute stehst.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aktuell ·{" "}
          <span className="font-semibold text-foreground">
            {roleLabel(state.role)}
          </span>
        </p>
      </header>

      {/* ── Modul 1: Bevölkerung (Opposition) ─────────────────────────── */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<Users className="size-5 text-foreground" />}
          kicker="Bevölkerung"
          title="So kommen deine Entscheidungen an"
        />
        {decisionsCount === 0 ? (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Triff deine erste Tagesentscheidung — danach siehst du hier,
              wie sie bei den Menschen ankommt.
            </p>
            <Link
              href="/heute"
              className={buttonVariants({ size: "lg" }) + " h-12"}
            >
              Erstes Briefing spielen
            </Link>
          </div>
        ) : (
          <IndicatorsCard
            indicators={popularity}
            decisions={state.decisions}
            baselineLabel="Start"
          />
        )}
      </section>

      {/* ── Modul 2: Deutschland (Regierung) ──────────────────────────── */}
      <section className="flex flex-col gap-3">
        {isGoverning ? (
          <>
            <SectionHeader
              icon={<Landmark className="size-5 text-foreground" />}
              kicker="Deutschland"
              title="Wie deine Entscheidungen das Land verändern"
            />
            <IndicatorsCard indicators={germany} decisions={state.decisions} />
          </>
        ) : (
          <div className="glass-card rounded-3xl p-7 flex flex-col items-center text-center gap-3">
            <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-foreground/5 border border-foreground/10">
              <Lock className="size-5 text-muted-foreground" />
            </span>
            <h2 className="font-serif text-xl font-semibold leading-tight">
              Auswirkung auf Deutschland
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Wird freigeschaltet, sobald du Minister oder Kanzler wirst.
              Dann zeigt sich hier, wie deine Entscheidungen das Land verändern.
            </p>
            <span className="text-xs text-muted-foreground/80 mt-1">
              Gewinne die nächste Wahl, um zu regieren.
            </span>
          </div>
        )}
      </section>

      {/* ── Modul 3: Politischer Kompass (erst ab 14 Entscheidungen) ───── */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          icon={<Compass className="size-5 text-foreground" />}
          kicker="Politischer Kompass"
          title="Aus deinen Entscheidungen"
        />
        {compassReady ? (
          <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4">
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
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dein Kompass entsteht nach deinen ersten {COMPASS_MIN_DECISIONS}{" "}
              Tagesentscheidungen — dann liegen genug Daten vor, um zu zeigen,
              wo du circa stehst.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-foreground/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/40"
                  style={{
                    width: `${Math.min(100, (decisionsCount / COMPASS_MIN_DECISIONS) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
                {Math.min(decisionsCount, COMPASS_MIN_DECISIONS)}/
                {COMPASS_MIN_DECISIONS}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <header className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center size-10 rounded-xl bg-foreground/5 border border-foreground/10 shrink-0">
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {kicker}
        </span>
        <h2 className="font-serif text-lg font-semibold">{title}</h2>
      </div>
    </header>
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
