"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper } from "lucide-react";

type Props = {
  kicker: string | null;
  headline: string;
  deck: string | null;
  onContinue: () => void;
};

// First card in the daily flow. Headline + one-sentence framing. One CTA.
export function BriefingCard({ kicker, headline, deck, onContinue }: Props) {
  return (
    <article className="flex flex-1 flex-col justify-center max-w-xl mx-auto w-full px-5 py-10 gap-7">
      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <Newspaper className="size-5" />
          </span>
          {kicker && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {kicker}
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-[1.1] text-foreground">
          {headline}
        </h1>

        {deck && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {deck}
          </p>
        )}
      </div>

      <Button
        onClick={onContinue}
        size="lg"
        className="h-12 w-full text-base group shadow-md shadow-primary/15"
      >
        Verstehen, was passiert
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </article>
  );
}
