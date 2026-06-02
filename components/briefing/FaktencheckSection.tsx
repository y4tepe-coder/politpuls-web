"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldQuestion,
  Check,
  X,
  Lightbulb,
  Quote,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import type { Dossier } from "@/lib/supabase/types";
import { markBriefingDoneLocally } from "@/lib/local/streak";

// Fake-News-Abhärtung: Der Nutzer schätzt eine echt aussehende Behauptung als
// echt oder fake ein und bekommt danach die Auflösung samt Erkennungs-Tipp.
// Das aktive Raten VOR der Auflösung ist der Lerneffekt (Prebunking). Wird im
// BriefingDeck als eigene Karte gezeigt; `onComplete` schaltet den Deck-Footer
// frei ("Weiter zum Pfad").
export function FaktencheckSection({
  dossier,
  onComplete,
}: {
  dossier: Dossier;
  onComplete?: () => void;
}) {
  const fc = dossier.faktencheck!;
  const [guess, setGuess] = useState<"echt" | "fake" | null>(null);

  const revealed = guess !== null;
  const correctAnswer: "echt" | "fake" = fc.ist_echt ? "echt" : "fake";
  const wasRight = guess === correctAnswer;

  function judge(value: "echt" | "fake") {
    if (revealed) return;
    setGuess(value);
    markBriefingDoneLocally();
    onComplete?.();
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          <ShieldQuestion className="size-3.5" />
          Echt oder Fake?
        </span>
        <h2 className="font-serif text-2xl font-semibold leading-snug">
          Würdest du das glauben?
        </h2>
      </header>

      {/* Die kursierende Behauptung — als geteilter Schnipsel gestaltet. */}
      <div className="rounded-2xl border border-foreground/15 bg-card p-5 flex flex-col gap-3 shadow-sm">
        {fc.praesentation && (
          <span className="text-xs font-medium text-muted-foreground">
            {fc.praesentation}
          </span>
        )}
        <div className="flex gap-2.5">
          <Quote className="size-5 text-foreground/30 shrink-0" />
          <p className="text-[17px] font-medium leading-relaxed text-foreground/90">
            {fc.behauptung}
          </p>
        </div>
      </div>

      {!revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => judge("echt")}
            className="glass-card h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-foreground/5 hover:border-foreground/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CircleCheck className="size-5" />
            Echt
          </button>
          <button
            type="button"
            onClick={() => judge("fake")}
            className="glass-card h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-foreground/5 hover:border-foreground/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CircleAlert className="size-5" />
            Fake
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 font-semibold ${
              wasRight
                ? "bg-success/10 text-success border border-success/30"
                : "bg-foreground/5 text-foreground border border-foreground/15"
            }`}
          >
            {wasRight ? (
              <Check className="size-5 shrink-0" strokeWidth={3} />
            ) : (
              <X className="size-5 shrink-0" strokeWidth={3} />
            )}
            {wasRight
              ? "Richtig erkannt!"
              : `Knapp daneben — es ist ${fc.ist_echt ? "echt" : "Fake"}.`}
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
              {fc.ist_echt ? (
                <CircleCheck className="size-3.5" />
              ) : (
                <CircleAlert className="size-3.5" />
              )}
              {fc.ist_echt ? "Das stimmt wirklich" : "Das ist irreführend"}
            </span>
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {fc.aufloesung}
            </p>
            <p className="text-[15px] leading-relaxed text-foreground/75">
              {fc.warum}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-5 flex gap-3">
            <Lightbulb className="size-5 text-primary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Woran du sowas erkennst
              </span>
              <p className="text-[15px] leading-relaxed text-foreground/85">{fc.tipp}</p>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
