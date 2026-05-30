"use client";

import type { ChoiceId, DossierChoice } from "@/lib/supabase/types";

type Props = {
  streitfrage: string | null;
  choices: DossierChoice[];
  onChoose: (id: ChoiceId) => void;
};

// Four choices. Frosted-glass tiles, no color flair. The badge letter is the
// only chromatic element. iOS-style: minimal, depend on shape + spacing.
export function ChoiceCard({ streitfrage, choices, onChoose }: Props) {
  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Du sitzt am Tisch
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {streitfrage ?? "Wofür entscheidest du dich?"}
        </h2>
      </header>

      <ul className="flex flex-col gap-2.5">
        {choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => onChoose(choice.id)}
              className="glass-card group w-full text-left rounded-2xl p-5 flex flex-col gap-3 hover:bg-foreground/5 hover:border-foreground/20 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-foreground text-background font-mono text-sm font-semibold">
                  {choice.id}
                </span>
                <span className="font-serif text-lg sm:text-xl font-semibold leading-snug pt-1">
                  {choice.label}
                </span>
              </div>
              <ul className="pl-12 flex flex-col gap-1 text-sm text-muted-foreground">
                {choice.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span aria-hidden>·</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
