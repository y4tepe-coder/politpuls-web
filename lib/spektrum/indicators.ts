import type { LocalDecision } from "@/lib/local/state";

// Vordefinierte Indikatoren mit Baseline-Werten fuer Deutschland 2026.
// User-Entscheidungen veraendern die Baseline ueber Zeit — der angezeigte
// "current"-Wert ist immer baseline + Summe aller deltas.
//
// Labels muessen 1:1 zu den `deltas[].label`-Strings aus den Dossiers passen
// (case-sensitive, Umlaute exakt!), damit der Aggregator sie findet.
export const DEFAULT_INDICATORS: ReadonlyArray<{
  label: string;
  description: string;
  /** Aktueller Stand in Deutschland 2026 (grobe Schaetzung). */
  baseline: number;
  /** Einheit fuer die Anzeige — z.B. "%" oder "Pkt". */
  unit: string;
  /** Richtung: ist ein +Delta gut (true) oder schlecht (false)? */
  goodWhenUp: boolean;
}> = [
  {
    label: "Beliebtheit",
    description: "Wie sehen dich die Wähler:innen?",
    baseline: 50,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Wirtschaftswachstum",
    description: "BIP-Trend (real, jährlich)",
    baseline: 0.5,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Inflationsrisiko",
    description: "Verbraucherpreise (HVPI)",
    baseline: 2.5,
    unit: "%",
    goodWhenUp: false,
  },
  {
    label: "Investitionsklima",
    description: "ifo-Geschäftsklima",
    baseline: 45,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Sicherheitsgefühl",
    description: "Wie sicher fühlt sich die Bevölkerung?",
    baseline: 55,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "CO₂-Pfad",
    description: "Distanz zum 1,5-Grad-Pfad",
    baseline: -15,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Soziale Gerechtigkeit",
    description: "Verteilung von Lasten und Chancen",
    baseline: 50,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Kaufkraft",
    description: "Reallohn-Entwicklung",
    baseline: -1,
    unit: "%",
    goodWhenUp: true,
  },
  {
    label: "Standortbewertung",
    description: "Wirtschaftsstandort Deutschland",
    baseline: 48,
    unit: "%",
    goodWhenUp: true,
  },
];

export type IndicatorValue = {
  label: string;
  description: string;
  baseline: number;
  unit: string;
  goodWhenUp: boolean;
  /** Summe aller deltas dieses Labels ueber alle Decisions. */
  userDelta: number;
  /** Aktueller Stand = baseline + userDelta. */
  current: number;
  /** Wie viele Decisions diesen Indikator beeinflusst haben. */
  hits: number;
};

// Summiert alle indicatorDeltas aus den Decisions auf die Baselines drauf.
// Default-Indikatoren werden immer zurueckgegeben, zusaetzliche Labels aus
// echten Decisions werden angehaengt (mit Baseline 0).
export function aggregateIndicators(
  decisions: LocalDecision[],
): IndicatorValue[] {
  const sums = new Map<string, { value: number; hits: number }>();

  for (const d of decisions) {
    if (!d.indicatorDeltas) continue;
    for (const delta of d.indicatorDeltas) {
      const cur = sums.get(delta.label) ?? { value: 0, hits: 0 };
      sums.set(delta.label, {
        value: cur.value + delta.delta,
        hits: cur.hits + 1,
      });
    }
  }

  const result: IndicatorValue[] = DEFAULT_INDICATORS.map((def) => {
    const sum = sums.get(def.label) ?? { value: 0, hits: 0 };
    return {
      label: def.label,
      description: def.description,
      baseline: def.baseline,
      unit: def.unit,
      goodWhenUp: def.goodWhenUp,
      userDelta: sum.value,
      current: def.baseline + sum.value,
      hits: sum.hits,
    };
  });

  // Zusaetzliche Labels aus den Decisions, die wir noch nicht als Default haben
  for (const [label, sum] of sums.entries()) {
    if (DEFAULT_INDICATORS.some((d) => d.label === label)) continue;
    result.push({
      label,
      description: "",
      baseline: 0,
      unit: "%",
      goodWhenUp: true,
      userDelta: sum.value,
      current: sum.value,
      hits: sum.hits,
    });
  }

  return result;
}

// Formatiert einen Indikator-Wert mit Vorzeichen + Einheit.
// Beispiele: 2.5 % | -1.0 % | +6 Pkt
export function formatIndicator(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  const rounded = Math.abs(value) < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${sign}${rounded} ${unit}`;
}
