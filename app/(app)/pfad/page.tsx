"use client";

import { useEffect, useState } from "react";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { PfadStopCard } from "@/components/pfad/PfadStopCard";
import { getLocalState } from "@/lib/local/state";

// 7-day snaking path, iOS / Duolingo style. Each day is a big circular stop
// connected to the next by a dotted vertical line. Today pulses; past days
// are green-checked (gespielt) oder gedämpft (verpasst); future days are locked.
export default function PfadPage() {
  // Spiel-Historie kommt aus dem Browser-State → Client-Komponente.
  const [stops, setStops] = useState<PfadStop[]>([]);

  useEffect(() => {
    const state = getLocalState();
    const playedDates = new Set<string>(
      state.decisions.map((d) => d.date.slice(0, 10)),
    );
    if (state.last_briefing_date) playedDates.add(state.last_briefing_date);
    setStops(buildPfadStops(new Date(), undefined, playedDates));
  }, []);

  const todayIndex = stops.findIndex((s) => s.status === "today");

  // Alternate left / right so the path snakes. Today stays centered for emphasis.
  const sides: Array<"left" | "right" | "center"> = stops.map((_, i) => {
    if (i === todayIndex) return "center";
    return i % 2 === 0 ? "left" : "right";
  });

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 pt-8 pb-2 flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
          Dein Pfad
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Eine Woche Politik.
        </h1>
        <p className="text-sm text-muted-foreground">
          Jeden Tag eine Entscheidung. Spiele den heutigen Tag, sieh die
          vergangenen, freue dich auf morgen.
        </p>
      </header>

      <section className="relative mx-auto w-full max-w-2xl px-5 py-10">
        {/* Dotted connector line down the middle */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-12 bottom-12 w-0.5 bg-foreground/15 hidden sm:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, currentColor 0, currentColor 4px, transparent 4px, transparent 10px)",
            color: "var(--foreground)",
            opacity: 0.2,
            background: "transparent",
            borderLeft: "2px dashed currentColor",
          }}
        />
        {/* Mobile fallback: line left-aligned beside markers */}
        <div
          aria-hidden
          className="absolute left-[2.25rem] top-12 bottom-12 w-0.5 sm:hidden"
          style={{
            opacity: 0.2,
            color: "var(--foreground)",
            borderLeft: "2px dashed currentColor",
          }}
        />

        <ol className="relative flex flex-col gap-6">
          {stops.map((stop, i) => (
            <li key={stop.date} className="flex">
              <PfadStopCard stop={stop} side={sides[i]} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
