"use client";

import type { DossierFact } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  facts: DossierFact[];
  onContinue: () => void;
};

// Three facts. Frosted-glass tiles, no color flair. The number is the visual.
export function FactsCard({ facts, onContinue }: Props) {
  return (
    <article className="flex flex-1 flex-col justify-center max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Worüber gestritten wird
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          Drei Zahlen, die alles erklären.
        </h2>
      </header>

      <ul className="grid gap-3">
        {facts.map((fact, index) => (
          <li
            key={`${fact.label}-${index}`}
            className="glass-card rounded-2xl p-5 flex items-baseline gap-4"
          >
            <span className="font-serif text-3xl sm:text-4xl font-semibold leading-none tabular-nums whitespace-nowrap text-foreground">
              {fact.value}
            </span>
            <span className="text-sm sm:text-base text-foreground/75 leading-snug">
              {fact.label}
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onContinue}
        size="lg"
        className="h-12 w-full text-base group"
      >
        Jetzt entscheiden
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </article>
  );
}
