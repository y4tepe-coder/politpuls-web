import { parties } from "./parties";
import type { Party, PartyId } from "./types";

// Wahlergebnis-Berechnung — portiert aus iOS Campaign.swift mit Vereinfachung.
//
// Inputs: User-Partei, Score (aus Programm + Plakat + Triell), deterministic seed
// Output: sortierte Ergebnisse (Partei + %), mögliche Koalitionen, User-Rolle

// Basis-Stimmen = realistische DE-Sonntagsfrage (Stand 2025/26, Aggregat aus
// wahlrecht.de / DAWUM / politpro): AfD knapp vor CDU, SPD & Grüne mittig, Linke
// über der 5%-Hürde, FDP + BSW klein/unter 5%. Summe ~94,5% (Rest = Sonstige,
// nicht dargestellt; unten wird auf 100% normalisiert).
const BASE_VOTES: Record<PartyId, number> = {
  afd: 27.5,
  cdu: 23,
  gruene: 14,
  spd: 12.5,
  linke: 10.5,
  fdp: 4,
  bsw: 3,
};

// partyId ist string (nicht PartyId), weil die selbst angelegte Partei
// ("custom") als zusätzlicher Contender mitspielen kann.
export type ElectionResult = {
  partyId: string;
  party: Party;
  percent: number; // 0..100
  mine: boolean;
};

export type Coalition = {
  partyIds: string[];
  sumPercent: number;
  // Label wie "Schwarz-Rot", "Ampel", "Jamaika"
  label: string;
};

export type ElectionRole = "kanzler" | "minister" | "opposition";

// Deterministischer Jitter: gleicher Seed → gleiches Ergebnis.
// Verhindert dass User durch Reload das Ergebnis verändert.
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 10000) / 10000;
  };
}

/**
 * Berechnet die Wahl. `score` = User-Kampagnen-Performance (aus Programm +
 * Plakat + Triell, grob -10..+37), `seed` stabil pro Wahl-Zyklus.
 *
 * Realismus zuerst: Die GEGNER-Werte bleiben auf ihrer realistischen Basis
 * (kein Einebnen mehr) — AfD ≳ CDU, FDP klein, Linke > FDP. Der Wahlkampf
 * verschiebt NUR die eigene Partei, gedeckelt auf ~ -3..+5 Punkte mit harter
 * Obergrenze. So kann eine kleine Partei mit starkem Wahlkampf die 5%-Hürde
 * knacken (= Erfolg), aber es entsteht nie eine 20%-FDP.
 */
const SCORE_SCALE = 0.15; // Performance → Prozent-Swing
const BONUS_MIN = -3; // schwache Kampagne
const BONUS_MAX = 5; // exzellente Kampagne
const SMALL_CAP = 9; // FDP/BSW/eigene Neupartei nie über ~9%
const CUSTOM_BASE = 3; // frisch gegründete Partei startet klein

const clampPct = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));

// Gedeckelter Kampagnen-Wert der EIGENEN Partei.
function boostedPct(base: number, score: number, jitter: number): number {
  const bonus = clampPct(score * SCORE_SCALE, BONUS_MIN, BONUS_MAX);
  const ceiling = base <= 6 ? SMALL_CAP : base + 6;
  return clampPct(base + bonus + jitter, 2, ceiling);
}

export function computeElectionResult(
  myPartyId: string | null,
  score: number,
  seed: string,
  // Wenn der Spieler eine eigene Partei führt, tritt sie als zusätzlicher
  // Contender an — mit einer durchschnittlichen Basis-Stimme.
  customParty?: Party,
): ElectionResult[] {
  const rng = seededRandom(seed);
  // Jitter ±1,5 — innerhalb der echten Umfrage-Streuung der Institute.
  const jitter = () => (rng() - 0.5) * 3;

  const raw: Array<{ id: string; percent: number }> = (Object.keys(BASE_VOTES) as PartyId[]).map(
    (id) => {
      const pct =
        id === myPartyId
          ? boostedPct(BASE_VOTES[id], score, jitter())
          : BASE_VOTES[id] + jitter();
      return { id, percent: Math.max(0.5, pct) };
    },
  );

  // Eigene (selbst gegründete) Partei: startet klein wie eine Neupartei; ein
  // starker Wahlkampf kann sie über die 5%-Hürde tragen — aber nicht ins Absurde.
  if (customParty && myPartyId === customParty.id) {
    raw.push({ id: customParty.id, percent: boostedPct(CUSTOM_BASE, score, jitter()) });
  }

  // Lookup, das auch die eigene Partei auflöst.
  const resolve = (id: string): Party =>
    id === customParty?.id ? customParty : parties.find((p) => p.id === id)!;

  // Normalisieren auf 100 %
  const sum = raw.reduce((a, b) => a + b.percent, 0);
  const normalised = raw.map((r) => ({
    id: r.id,
    percent: (r.percent / sum) * 100,
  }));

  return normalised
    .map(({ id, percent }) => ({
      partyId: id,
      party: resolve(id),
      percent: Math.round(percent * 10) / 10,
      mine: id === myPartyId,
    }))
    .sort((a, b) => b.percent - a.percent);
}

// Welche Koalitionen sind realistisch? Filtert iOS-Logik:
//   - AfD ist nicht koalitionsfähig (außer mit AfD-Anhang)
//   - Linke nicht mit CDU/FDP
//   - BSW nicht mit Grüne
// Wir geben max 6 Optionen zurück, sortiert nach Zahl der Partner (klein zuerst)
// und dann nach knappster Mehrheit (50,1 % > 60 %).
const FORBIDDEN_PAIRS: Array<[PartyId, PartyId]> = [
  ["linke", "cdu"],
  ["linke", "fdp"],
  ["bsw", "gruene"],
];

const UNCOALITABLE: PartyId[] = ["afd"];

const COALITION_LABELS: Record<string, string> = {
  "cdu+spd": "Große Koalition",
  "cdu+gruene": "Schwarz-Grün",
  "cdu+spd+gruene": "Deutschland-Koalition",
  "cdu+gruene+fdp": "Jamaika",
  "spd+gruene+fdp": "Ampel",
  "spd+gruene": "Rot-Grün",
  "spd+linke+bsw": "Rot-Rot-Sahra",
  "spd+linke": "Rot-Rot",
  "cdu+bsw": "CDU-BSW",
};

function coalitionLabel(ids: string[]): string {
  const key = [...ids].sort().join("+");
  return (
    COALITION_LABELS[key] ??
    ids
      .map((id) => parties.find((p) => p.id === id)?.shortName ?? id)
      .join(" + ")
  );
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [head, ...rest] = arr;
  const withHead = combinations(rest, k - 1).map((c) => [head, ...c]);
  const withoutHead = combinations(rest, k);
  return [...withHead, ...withoutHead];
}

export function possibleCoalitions(results: ElectionResult[]): Coalition[] {
  // Top 5 Parteien betrachten, AfD raus
  const candidates = results
    .filter((r) => !UNCOALITABLE.includes(r.partyId as PartyId))
    .slice(0, 6);

  const coalitions: Coalition[] = [];
  for (let size = 1; size <= 3; size++) {
    const combos = combinations(candidates, size);
    for (const combo of combos) {
      // Check forbidden pairs
      const ids = combo.map((r) => r.partyId);
      const hasForbidden = FORBIDDEN_PAIRS.some(
        ([a, b]) => ids.includes(a) && ids.includes(b),
      );
      if (hasForbidden) continue;
      const sum = combo.reduce((a, b) => a + b.percent, 0);
      if (sum >= 50) {
        coalitions.push({
          partyIds: ids,
          sumPercent: Math.round(sum * 10) / 10,
          label: coalitionLabel(ids),
        });
      }
    }
  }

  return coalitions
    .sort((a, b) => {
      // Weniger Partner zuerst, dann knappere Mehrheit
      if (a.partyIds.length !== b.partyIds.length)
        return a.partyIds.length - b.partyIds.length;
      return a.sumPercent - b.sumPercent;
    })
    .slice(0, 6);
}

/**
 * Bestimmt die Rolle des Users nach der Wahl.
 *   - Eigene Partei #1 → Kanzler
 *   - Eigene Partei in der gewählten Koalition → Minister
 *   - Sonst → Opposition
 */
export function determineRole(
  results: ElectionResult[],
  pickedCoalition: Coalition | null,
  myPartyId: string | null,
): ElectionRole {
  if (!myPartyId) return "opposition";
  if (results[0]?.partyId === myPartyId) return "kanzler";
  if (pickedCoalition?.partyIds.includes(myPartyId)) return "minister";
  return "opposition";
}
