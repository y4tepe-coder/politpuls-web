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
import { CheckCircle2, Frown, Sparkles, RotateCcw } from "lucide-react";

type Props = {
  choice: DossierChoice;
  consequence: DossierConsequence;
  spektrumBefore: SpektrumVector;
  spektrumAfter: SpektrumVector;
  onRestart: () => void;
};

// Final card: celebrates the decision, shows group reactions, and reveals
// the spektrum shift on the 2D compass with the top three closest parties.
export function ConsequenceCard({
  choice,
  consequence,
  spektrumBefore,
  spektrumAfter,
  onRestart,
}: Props) {
  const matches = partyProximity(spektrumAfter);

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-7">
      {/* Achievement banner */}
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
