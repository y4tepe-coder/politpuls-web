"use client";

import type {
  DossierChoice,
  DossierConsequence,
} from "@/lib/supabase/types";
import type { SpektrumVector } from "@/lib/spektrum/types";
import { partyProximity } from "@/lib/spektrum/compute";
import Link from "next/link";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import {
  CheckCircle2,
  Frown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type Props = {
  choice: DossierChoice;
  consequence: DossierConsequence;
  spektrumBefore: SpektrumVector;
  spektrumAfter: SpektrumVector;
};

export function ConsequenceCard({
  choice,
  consequence,
  spektrumBefore,
  spektrumAfter,
}: Props) {
  const matches = partyProximity(spektrumAfter);
  const deltas = choice.deltas ?? [];

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-6">
      <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {choice.label}
        </h2>
        <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
          {consequence.summary}
        </p>
      </div>

      {deltas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground px-1">
            Konkrete Auswirkungen
          </h3>
          <ul className="flex flex-col gap-2">
            {deltas.map((d, i) => (
              <li
                key={i}
                className="glass-card flex items-center gap-3 rounded-xl px-4 py-3"
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
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold tabular-nums border ${
                    d.good
                      ? "border-foreground/15 bg-foreground/5 text-foreground"
                      : "border-foreground/15 bg-foreground/5 text-foreground/60"
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
          title="Freuen sich"
          icon={<CheckCircle2 className="size-4" />}
          items={consequence.cheers}
        />
        <ReactionTile
          title="Sind enttäuscht"
          icon={<Frown className="size-4" />}
          items={consequence.upset}
          muted
        />
      </div>

      <section className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
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

      <Link
        href="/home"
        className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold group hover:bg-primary/90 transition-colors"
      >
        Weiter zum Pfad
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      <p className="text-on-bg text-xs text-center text-foreground/65">
        Morgen wartet das nächste Dossier auf dich.
      </p>
    </article>
  );
}

function ReactionTile({
  title,
  icon,
  items,
  muted,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <h3
        className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-foreground/80">
        {items.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
