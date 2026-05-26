import type { LocalDecision } from "@/lib/local/state";

// Vordefinierte Indikatoren — werden immer angezeigt, auch ohne dass eine
// Choice sie schon beeinflusst hat. Die Reihenfolge bestimmt das Layout.
// Labels muessen 1:1 zu den `deltas[].label`-Strings aus den Dossiers passen
// (case-sensitive), damit der Aggregator sie findet.
export const DEFAULT_INDICATORS: ReadonlyArray<{
  label: string;
  description: string;
  /** Richtung: ist ein +Delta gut (true) oder schlecht (false)? */
  goodWhenUp: boolean;
}> = [
  {
    label: "Beliebtheit",
    description: "Wie sehen dich die Waehler:innen?",
    goodWhenUp: true,
  },
  {
    label: "Wirtschaftswachstum",
    description: "BIP-Trend ueber alle Entscheidungen",
    goodWhenUp: true,
  },
  {
    label: "Inflationsrisiko",
    description: "Preise vs. Loehne",
    goodWhenUp: false,
  },
  {
    label: "Investitionsklima",
    description: "Wo Unternehmen ihr Geld lassen",
    goodWhenUp: true,
  },
  {
    label: "Sicherheitsgefuehl",
    description: "Wie sicher fuehlt sich die Bevoelkerung?",
    goodWhenUp: true,
  },
  {
    label: "CO₂-Pfad",
    description: "Sind wir noch auf dem 1,5-Grad-Pfad?",
    goodWhenUp: true,
  },
  {
    label: "Soziale Gerechtigkeit",
    description: "Verteilung von Lasten und Chancen",
    goodWhenUp: true,
  },
  {
    label: "Kaufkraft",
    description: "Was bleibt am Monatsende uebrig?",
    goodWhenUp: true,
  },
];

export type IndicatorValue = {
  label: string;
  description: string;
  goodWhenUp: boolean;
  /** Summe aller deltas dieses Labels ueber alle Decisions. */
  value: number;
  /** Wie viele Decisions diesen Indikator beeinflusst haben. */
  hits: number;
};

// Summiert alle indicatorDeltas aus den Decisions. Default-Indikatoren werden
// immer zurueckgegeben (value 0, hits 0), zusaetzliche Labels aus echten
// Decisions werden angehaengt.
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

  // Default-Indikatoren in der definierten Reihenfolge, mit aggregierten Werten
  const result: IndicatorValue[] = DEFAULT_INDICATORS.map((def) => {
    const sum = sums.get(def.label) ?? { value: 0, hits: 0 };
    return {
      label: def.label,
      description: def.description,
      goodWhenUp: def.goodWhenUp,
      value: sum.value,
      hits: sum.hits,
    };
  });

  // Zusaetzliche Labels aus den Decisions, die wir noch nicht als Default haben
  for (const [label, sum] of sums.entries()) {
    if (DEFAULT_INDICATORS.some((d) => d.label === label)) continue;
    result.push({
      label,
      description: "",
      goodWhenUp: true,
      value: sum.value,
      hits: sum.hits,
    });
  }

  return result;
}
