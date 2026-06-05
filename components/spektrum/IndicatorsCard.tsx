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
  /** Praefix vor dem Basiswert je Zeile. Default "Basis DE" (Deutschland-KPIs);
   *  fuer persoenliche Werte (z.B. Beliebtheit) z.B. "Start". */
  baselineLabel?: string;
};

// Politiker-Performance auf einen Blick. Pro Zeile:
// links Label/Description, in der Mitte eine grosse Verlaufs-Grafik
// (Sparkline + Baseline-Referenzlinie + Area-Fill), rechts der
// aktuelle Wert und die Veraenderung durch User-Entscheidungen.
export function IndicatorsCard({ indicators, decisions, baselineLabel = "Basis DE" }: Props) {
  return (
    <ul className="glass-card rounded-2xl p-3 sm:p-4 flex flex-col gap-1.5">
      {indicators.map((i) => (
        <IndicatorRow
          key={i.label}
          indicator={i}
          decisions={decisions}
          baselineLabel={baselineLabel}
        />
      ))}
    </ul>
  );
}

function IndicatorRow({
  indicator,
  decisions,
  baselineLabel,
}: {
  indicator: IndicatorValue;
  decisions: LocalDecision[];
  baselineLabel: string;
}) {
  const { label, description, current, baseline, userDelta, unit, goodWhenUp, hits } =
    indicator;

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
      ? "text-success bg-success/14 border-success/30"
      : isBad
        ? "text-rose-700 bg-rose-500/14 border-rose-500/30"
        : "text-foreground/55 bg-foreground/5 border-foreground/10";

  const series = buildSeries(decisions, label, baseline);

  return (
    <li className="flex items-center justify-between gap-3 sm:gap-5 px-2 py-3 rounded-xl hover:bg-foreground/[0.04] transition-colors">
      {/* Label + Description — feste schmale Spalte */}
      <div className="flex flex-col min-w-0 w-[42%] sm:w-[38%] shrink-0">
        <span className="text-sm sm:text-base font-semibold leading-tight">
          {label}
        </span>
        {description && (
          <span className="text-xs text-foreground/60 leading-snug mt-0.5">
            {description}
          </span>
        )}
        <span className="text-xs text-foreground/45 mt-1 tabular-nums">
          {baselineLabel}: {formatIndicator(baseline, unit)}
        </span>
      </div>

      {/* Verlauf — nimmt den maximalen Mittelraum */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <Sparkline
          series={series}
          baseline={baseline}
          isGood={isGood}
          isBad={isBad}
          inactive={inactive}
        />
      </div>

      {/* Werte rechts — feste schmale Spalte */}
      <div className="flex flex-col items-end gap-1 shrink-0 w-[68px] sm:w-[80px]">
        <span
          className={`font-mono tabular-nums text-base sm:text-lg font-bold leading-tight ${
            inactive ? "text-foreground/60" : "text-foreground"
          }`}
        >
          {formatIndicator(current, unit)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono tabular-nums font-semibold border ${trendColor}`}
        >
          <Icon className="size-2.5" strokeWidth={2.5} />
          {inactive ? "—" : (userDelta > 0 ? "+" : "") + userDelta}
        </span>
      </div>
    </li>
  );
}

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

// Grosse Sparkline: zeigt Baseline als gestrichelte Referenzlinie, den
// User-Verlauf als kraeftige Linie mit Area-Fill und einen Punkt am Ende.
function Sparkline({
  series,
  baseline,
  isGood,
  isBad,
  inactive,
}: {
  series: number[];
  baseline: number;
  isGood: boolean;
  isBad: boolean;
  inactive: boolean;
}) {
  const W = 160;
  const H = 56;
  const PAD = 4;

  // Wertebereich umfassen: Baseline immer in der Mitte halten, sonst aus den
  // tatsaechlichen Werten — plus etwas Padding damit nichts an die Kante stoesst.
  const allValues = [baseline, ...series];
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  const span = Math.max(max - min, 4); // mindestens 4 Einheiten Spreizung
  // Symmetrisches Padding um baseline, damit kleine Bewegungen auch sichtbar werden
  const halfSpan = Math.max(Math.abs(max - baseline), Math.abs(baseline - min), 2);
  min = baseline - halfSpan * 1.3;
  max = baseline + halfSpan * 1.3;
  void span;

  const yFor = (v: number) =>
    H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const baselineY = yFor(baseline);

  const color = inactive
    ? { stroke: "stroke-foreground/35", fill: "fill-foreground/5", dot: "fill-foreground/30" }
    : isGood
      ? { stroke: "stroke-success", fill: "fill-success/15", dot: "fill-success" }
      : isBad
        ? { stroke: "stroke-rose-500", fill: "fill-rose-500/15", dot: "fill-rose-500" }
        : { stroke: "stroke-foreground/50", fill: "fill-foreground/8", dot: "fill-foreground/50" };

  if (series.length < 2) {
    // Noch keine Decisions — nur Baseline-Referenzlinie anzeigen
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="max-w-[160px]">
        <line
          x1={PAD}
          y1={baselineY}
          x2={W - PAD}
          y2={baselineY}
          strokeDasharray="3 3"
          strokeWidth={1.25}
          className="stroke-foreground/30"
        />
        <text
          x={W - PAD}
          y={baselineY - 4}
          textAnchor="end"
          className="fill-foreground/40 font-mono"
          style={{ fontSize: 8 }}
        >
          Basis
        </text>
      </svg>
    );
  }

  const stepX = (W - PAD * 2) / (series.length - 1);
  const points = series.map((v, i) => ({
    x: PAD + i * stepX,
    y: yFor(v),
  }));

  const polyPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPoints =
    `${PAD},${H - PAD} ` + polyPoints + ` ${(W - PAD).toFixed(1)},${(H - PAD).toFixed(1)}`;
  const lastPoint = points[points.length - 1];

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="max-w-[160px]">
      {/* Baseline-Referenz (gestrichelt) */}
      <line
        x1={PAD}
        y1={baselineY}
        x2={W - PAD}
        y2={baselineY}
        strokeDasharray="3 3"
        strokeWidth={1.25}
        className="stroke-foreground/25"
      />
      {/* Area-Fill */}
      <polygon points={areaPoints} className={color.fill} />
      {/* Verlaufslinie */}
      <polyline
        points={polyPoints}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color.stroke}
      />
      {/* Endpunkt-Dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={3}
        className={color.dot}
        stroke="white"
        strokeWidth={1.5}
      />
    </svg>
  );
}
