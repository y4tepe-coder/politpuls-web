"use client";

import type {
  DossierChoice,
  DossierConsequence,
} from "@/lib/supabase/types";
import type { SpektrumVector } from "@/lib/spektrum/types";
import { partyProximity } from "@/lib/spektrum/compute";
import { Button } from "@/components/ui/button";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import {
  CheckCircle2,
  Frown,
  Sparkles,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type Props = {
  choice: DossierChoice;
  consequence: DossierConsequence;
  spektrumBefore: SpektrumVector;
  spektrumAfter: SpektrumVector;
  onRestart: () => void;
};

// Final card: shows the user's choice, group reactions, the spektrum shift,
// and (ported from iOS) impact delta rows per choice — labelled metrics with
// a signed percent pill colored green/red.
export function ConsequenceCard({
  choice,
  consequence,
  spektrumBefore,
  spektrumAfter,
  onRestart,
}: Props) {
  const matches = partyProximity(spektrumAfter);
  const deltas = choice.deltas ?? [];

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <div className="rounded-2xl bg-gradient-to-br from-success/20 via-success/10 to-card border border-success/30 p-5 flex items-center gap-4">
        <span className="inline-flex items-center justify-center size-12 rounded-full bg-success text-success-foreground shadow-md shadow-success/30">
          <Sparkles className="size-6" />
        </span>
        <div className="flex flex-col">
          <span className="text-success text-[11px] font-semibold uppercase tracking-[0.18em]">
            Entscheidung gefallen
          </span>
          <span className="font-serif text-lg font-semibold leading-snug">
            Du hast Wahl {choice.id} gewählt.
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 flex flex-col gap-3">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {choice.label}
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {consequence.summary}
        </p>
      </div>

      {/* Impact deltas (iOS-style) */}
      {deltas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground px-1">
            Konkrete Auswirkungen
          </h3>
          <ul className="flex flex-col gap-2">
            {deltas.map((d, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-medium leading-tight">
                    {d.label}
                  </span>
                  {d.note && (
                    <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {d.note}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold tabular-nums ${
                    d.good
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-chart-4/15 text-chart-4 border border-chart-4/30"
                  }`}
                >
                  {d.good ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {d.delta > 0 ? "+" : ""}
                  {d.delta}
                  {d.unit ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReactionTile
          tone="success"
          title="Freuen sich"
          icon={<CheckCircle2 className="size-4" />}
          items={consequence.cheers}
        />
        <ReactionTile
          tone="warm"
          title="Sind enttäuscht"
          icon={<Frown className="size-4" />}
          items={consequence.upset}
        />
      </div>

      <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
            Dein politischer Kompass
          </span>
          <h3 className="font-serif text-xl font-semibold leading-snug">
            So hat sich dein Standpunkt verschoben.
          </h3>
        </header>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <CompassMap user={spektrumAfter} previous={spektrumBefore} />
          <div className="w-full sm:flex-1 flex flex-col gap-3">
            <h4 className="text-sm font-medium">Deine drei nächsten Parteien</h4>
            <PartyMatches matches={matches} />
          </div>
        </div>
      </section>

      <Button
        variant="outline"
        onClick={onRestart}
        className="w-full h-11 group"
      >
        <RotateCcw className="size-4 mr-2 group-hover:-rotate-12 transition-transform" />
        Briefing noch einmal
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Morgen wartet das nächste Dossier auf dich. Komm wieder, halte deine Streak.
      </p>
    </article>
  );
}

function ReactionTile({
  tone,
  title,
  icon,
  items,
}: {
  tone: "success" | "warm";
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  const styles =
    tone === "success"
      ? "bg-success/10 border-success/30 text-success"
      : "bg-chart-4/10 border-chart-4/30 text-chart-4";
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${styles}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-foreground">
        {items.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
