"use client";

import type { DossierFact } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";

type Props = {
  facts: DossierFact[];
  onContinue: () => void;
};

// Second card: three numbered facts that frame the decision. One CTA.
// Each fact gets its own color tile to give the screen visual rhythm.
export function FactsCard({ facts, onContinue }: Props) {
  const palettes = [
    "from-primary/12 via-primary/5 border-primary/30 text-primary",
    "from-accent/15 via-accent/5 border-accent/40 text-accent-foreground",
    "from-success/15 via-success/5 border-success/40 text-success",
  ] as const;

  return (
    <article className="flex flex-1 flex-col justify-center max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-accent/15 text-accent">
          <BarChart3 className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
            Worüber gestritten wird
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
            Drei Zahlen, die alles erklären.
          </h2>
        </div>
      </header>

      <ul className="grid gap-3">
        {facts.map((fact, index) => {
          const palette = palettes[index % palettes.length];
          return (
            <li
              key={`${fact.label}-${index}`}
              className={`rounded-2xl border bg-gradient-to-br to-card p-5 flex items-baseline gap-4 ${palette}`}
            >
              <span className="font-serif text-3xl sm:text-4xl font-bold leading-none tabular-nums whitespace-nowrap">
                {fact.value}
              </span>
              <span className="text-sm sm:text-base text-foreground/80 leading-snug">
                {fact.label}
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        onClick={onContinue}
        size="lg"
        className="h-12 w-full text-base group shadow-md shadow-accent/25 bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Jetzt entscheiden
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </article>
  );
}
