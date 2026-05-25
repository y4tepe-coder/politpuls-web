"use client";

import type { DossierFact } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";

type Props = {
  facts: DossierFact[];
  onContinue: () => void;
};

// Second card: three numbered facts that frame the decision. One CTA.
// Each fact tile uses a pastel hand-painted look so the page feels alive,
// not corporate. Three tones rotate to give the screen visual rhythm.
export function FactsCard({ facts, onContinue }: Props) {
  const palettes = [
    "bg-pastel-sky text-pastel-sky-ink border-pastel-sky-ink/15",
    "bg-pastel-peach text-pastel-peach-ink border-pastel-peach-ink/15",
    "bg-pastel-mint text-pastel-mint-ink border-pastel-mint-ink/15",
  ] as const;

  return (
    <article className="flex flex-1 flex-col justify-center max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-pastel-peach text-pastel-peach-ink">
          <BarChart3 className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-pastel-peach-ink text-[11px] font-semibold uppercase tracking-[0.18em]">
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
              className={`rounded-2xl border p-5 flex items-baseline gap-4 shadow-sm ${palette}`}
            >
              <span className="font-serif text-3xl sm:text-4xl font-bold leading-none tabular-nums whitespace-nowrap">
                {fact.value}
              </span>
              <span className="text-sm sm:text-base leading-snug">
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
