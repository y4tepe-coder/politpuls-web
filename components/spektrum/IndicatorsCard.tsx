"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  formatIndicator,
  type IndicatorValue,
} from "@/lib/spektrum/indicators";
import type { LocalDecision } from "@/lib/local/state";

type Props = {
  indicators: IndicatorValue[];
  decisions: LocalDecision[];
};

// Politiker-Performance auf einen Blick: klassische Indikatoren mit
// Baseline (echter Stand DE 2026) + Summe aller User-Deltas.
//
// Jede Zeile zeigt:
//   - Label + Beschreibung links
//   - Mini-Sparkline (Verlauf ueber Decisions) Mitte
//   - Aktueller Wert (gross) + Delta-Pille rechts
export function IndicatorsCard({ indicators, decisions }: Props) {
  return (
    <ul className="glass-card rounded-2xl p-2 sm:p-3 flex flex-col gap-0.5">
      {indicators.map((i) => (
        <IndicatorRow key={i.label} indicator={i} decisions={decisions} />
      ))}
    </ul>
  );
}

function IndicatorRow({
  indicator,
  decisions,
}: {
  indicator: IndicatorValue;
  decisions: LocalDecision[];
}) {
  const { label, description, current, userDelta, unit, goodWhenUp, hits } =
    indicator;

  // Trend-Klassifikation: ist die User-Veraenderung "gut" oder "schlecht"
  // bezogen auf den Indikator (Inflation: -ist-gut, BIP: +ist-gut).
  const inactive = hits === 0;
  const isPositive = userDelta > 0;
  const isNegative = userDelta < 0;
  const isGood =
    !inactive && ((goodWhenUp && isPositive) || (!goodWhenUp && isNegative));
  const isBad =
    !inactive && ((goodWhenUp && isNegative) || (!goodWhenUp && isPositive));

  const Icon = inactive ? Minus : isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const trendColor = inactive
    ? "text-foreground/45 bg-foreground/5 border-foreground/10"
    : isGood
      ? "text-emerald-700 bg-emerald-500/12 border-emerald-500/25"
      : isBad
        ? "text-rose-700 bg-rose-500/12 border-rose-500/25"
        : "text-foreground/55 bg-foreground/5 border-foreground/10";

  // Verlauf der letzten Entscheidungen fuer Sparkline
  const series = buildSeries(decisions, label, indicator.baseline);

  return (
    <li className="flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-xl hover:bg-foreground/[0.04] transition-colors">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        {description && (
          <span className="text-[11px] text-foreground/60 leading-snug">
            {description}
          </span>
        )}
      </div>

      <Sparkline series={series} isGood={isGood} isBad={isBad} inactive={inactive} />

      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[64px]">
        <span
          className={`font-mono tabular-nums text-sm font-semibold leading-tight ${
            inactive ? "text-foreground/60" : "text-foreground"
          }`}
        >
          {formatIndicator(current, unit)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-semibold border ${trendColor}`}
        >
          <Icon className="size-2.5" strokeWidth={2.5} />
          {inactive ? "—" : (userDelta > 0 ? "+" : "") + userDelta}
        </span>
      </div>
    </li>
  );
}

// Baut die Werte-Reihe von baseline → … → current ueber alle Decisions
// chronologisch. Verwendet fuer die Sparkline.
function buildSeries(
  decisions: LocalDecision[],
  label: string,
  baseline: number,
): number[] {
  const sorted = [...decisions].sort((a, b) => a.date.localeCompare(b.date));
  const values: number[] = [baseline];
  let acc = baseline;
  for (const d of sorted) {
    const hit = d.indicatorDeltas?.find((x) => x.label === label);
    if (hit) acc += hit.delta;
    values.push(acc);
  }
  return values;
}

// Mini-Sparkline als inline SVG. Faerbt sich gruen/rot/grau je nach Trend.
function Sparkline({
  series,
  isGood,
  isBad,
  inactive,
}: {
  series: number[];
  isGood: boolean;
  isBad: boolean;
  inactive: boolean;
}) {
  const W = 64;
  const H = 24;

  if (series.length < 2) {
    // Nur Baseline-Linie als horizontaler Strich
    return (
      <svg width={W} height={H} className="shrink-0" aria-hidden>
        <line
          x1={2}
          y1={H / 2}
          x2={W - 2}
          y2={H / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-foreground/20"
        />
      </svg>
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = (W - 4) / (series.length - 1);
  const points = series.map((v, i) => {
    const x = 2 + i * stepX;
    const y = H - 2 - ((v - min) / range) * (H - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const color = inactive
    ? "stroke-foreground/30"
    : isGood
      ? "stroke-emerald-500"
      : isBad
        ? "stroke-rose-500"
        : "stroke-foreground/45";

  return (
    <svg width={W} height={H} className="shrink-0" aria-hidden>
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  );
}
