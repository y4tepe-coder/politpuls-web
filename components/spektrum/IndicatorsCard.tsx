"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { IndicatorValue } from "@/lib/spektrum/indicators";

type Props = {
  indicators: IndicatorValue[];
};

// Politiker-Performance auf einen Blick: klassische Indikatoren wie
// Beliebtheit, Wirtschaftswachstum, Inflationsrisiko etc. — aufsummiert
// aus den `deltas` aller bisherigen Tagesentscheidungen.
//
// Wir zeigen den aktuellen Wert (Summe der Deltas) plus eine Trend-Pille
// (gut/schlecht je nach `goodWhenUp`). Indikatoren ohne Daten (hits=0)
// rendern grau als "Noch keine Daten".
export function IndicatorsCard({ indicators }: Props) {
  return (
    <ul className="glass-card rounded-2xl p-3 sm:p-4 flex flex-col gap-1">
      {indicators.map((i) => (
        <IndicatorRow key={i.label} indicator={i} />
      ))}
    </ul>
  );
}

function IndicatorRow({ indicator }: { indicator: IndicatorValue }) {
  const { label, description, goodWhenUp, value, hits } = indicator;
  const inactive = hits === 0;
  const isPositive = value > 0;
  const isNegative = value < 0;
  // good wenn Wert in Richtung goodWhenUp geht
  const isGood =
    !inactive && ((goodWhenUp && isPositive) || (!goodWhenUp && isNegative));
  const isBad =
    !inactive && ((goodWhenUp && isNegative) || (!goodWhenUp && isPositive));

  const Icon = inactive ? Minus : isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const trendColor = inactive
    ? "text-foreground/35"
    : isGood
      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
      : isBad
        ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
        : "text-foreground/55";

  return (
    <li className="flex items-center justify-between gap-3 px-2 py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        {description && (
          <span className="text-[11px] text-foreground/60 leading-snug">
            {description}
          </span>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono tabular-nums font-semibold border shrink-0 ${trendColor}`}
      >
        <Icon className="size-3" strokeWidth={2.5} />
        {inactive ? "—" : (value > 0 ? "+" : "") + value}
      </span>
    </li>
  );
}
