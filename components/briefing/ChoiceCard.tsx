"use client";

import type { ChoiceId, DossierChoice } from "@/lib/supabase/types";
import { Vote } from "lucide-react";

type Props = {
  streitfrage: string | null;
  choices: DossierChoice[];
  onChoose: (id: ChoiceId) => void;
};

// Third card: the decision. Four pastel-tinted choice cards, each with a
// coloured edge stripe + a letter badge in the matching pastel-ink.
// Same pastel family as facts/spectrum tiles for visual coherence.
export function ChoiceCard({ streitfrage, choices, onChoose }: Props) {
  const palettes = [
    {
      bar: "before:bg-pastel-sky-ink",
      badge: "bg-pastel-sky text-pastel-sky-ink",
      hover: "hover:bg-pastel-sky/40",
    },
    {
      bar: "before:bg-pastel-mint-ink",
      badge: "bg-pastel-mint text-pastel-mint-ink",
      hover: "hover:bg-pastel-mint/40",
    },
    {
      bar: "before:bg-pastel-peach-ink",
      badge: "bg-pastel-peach text-pastel-peach-ink",
      hover: "hover:bg-pastel-peach/40",
    },
    {
      bar: "before:bg-pastel-lavender-ink",
      badge: "bg-pastel-lavender text-pastel-lavender-ink",
      hover: "hover:bg-pastel-lavender/40",
    },
  ] as const;

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <header className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-pastel-mint text-pastel-mint-ink">
          <Vote className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-pastel-mint-ink text-[11px] font-semibold uppercase tracking-[0.18em]">
            Du sitzt am Tisch
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
            {streitfrage ?? "Wofür entscheidest du dich?"}
          </h2>
        </div>
      </header>

      <ul className="flex flex-col gap-3">
        {choices.map((choice, index) => {
          const palette = palettes[index % palettes.length];
          return (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => onChoose(choice.id)}
                className={`group relative w-full text-left rounded-2xl border border-border bg-card transition-all p-5 pl-7 flex flex-col gap-3 overflow-hidden hover:border-foreground/20 hover:shadow-md before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:rounded-r-md ${palette.bar} ${palette.hover}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center size-9 rounded-full font-mono text-sm font-semibold ${palette.badge}`}
                  >
                    {choice.id}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-semibold leading-snug pt-0.5">
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
          );
        })}
      </ul>
    </article>
  );
}
