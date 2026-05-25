"use client";

import type { ChoiceId, DossierChoice } from "@/lib/supabase/types";
import { Vote } from "lucide-react";

type Props = {
  streitfrage: string | null;
  choices: DossierChoice[];
  onChoose: (id: ChoiceId) => void;
};

// Third card: the decision. Big tappable choice cards, one per option.
// Each choice gets its own accent stripe so the four options feel distinct.
export function ChoiceCard({ streitfrage, choices, onChoose }: Props) {
  const stripes = [
    "before:bg-primary",
    "before:bg-success",
    "before:bg-accent",
    "before:bg-chart-4",
  ] as const;
  const letterBg = [
    "bg-primary text-primary-foreground",
    "bg-success text-success-foreground",
    "bg-accent text-accent-foreground",
    "bg-chart-4 text-white",
  ] as const;

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-success/15 text-success">
          <Vote className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-success text-[11px] font-semibold uppercase tracking-[0.18em]">
            Du sitzt am Tisch
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
            {streitfrage ?? "Wofür entscheidest du dich?"}
          </h2>
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {choices.map((choice, index) => {
          const stripe = stripes[index % stripes.length];
          const badge = letterBg[index % letterBg.length];
          return (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => onChoose(choice.id)}
                className={`group relative w-full text-left rounded-2xl border border-border bg-card hover:border-foreground/30 hover:shadow-md transition-all p-5 pl-7 flex flex-col gap-3 overflow-hidden before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:rounded-r-md ${stripe}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center size-8 rounded-full font-mono text-sm font-semibold ${badge}`}
                  >
                    {choice.id}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-semibold leading-snug pt-0.5">
                    {choice.label}
                  </span>
                </div>
                <ul className="pl-11 flex flex-col gap-1 text-sm text-muted-foreground">
                  {choice.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span aria-hidden>·</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
