import { parties } from "./parties";
import type { Party, PartyId } from "./types";

// Wahlergebnis-Berechnung — portiert aus iOS Campaign.swift mit Vereinfachung.
//
// Inputs: User-Partei, Score (aus Programm + Plakat + Triell), deterministic seed
// Output: sortierte Ergebnisse (Partei + %), mögliche Koalitionen, User-Rolle

// Basis-Stimmen aus typischen DE-Umfragen 2025. Summe ~95%, Rest = sonstige.
const BASE_VOTES: Record<PartyId, number> = {
  cdu: 30,
  afd: 18,
  spd: 15,
  gruene: 11,
  bsw: 7,
  fdp: 5,
  linke: 4,
};

export type ElectionResult = {
  partyId: PartyId;
  party: Party;
  percent: number; // 0..100
  mine: boolean;
};

export type Coalition = {
  partyIds: PartyId[];
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
 * Berechnet die Wahl. Score ist die User-Performance (-50..+50), Seed
 * sollte stabil pro Wahl-Zyklus sein (z.B. user_id + week).
 */
export function computeElectionResult(
  myPartyId: PartyId | null,
  score: number,
  seed: string,
): ElectionResult[] {
  const rng = seededRandom(seed);
  const myScoreBonus = Math.max(-8, Math.min(8, score * 0.15));

  const raw: Array<{ id: PartyId; percent: number }> = (Object.keys(BASE_VOTES) as PartyId[]).map(
    (id) => {
      let pct = BASE_VOTES[id];
      // User-Partei bekommt Score-Bonus
      if (id === myPartyId) pct += myScoreBonus;
      // Jitter ±2 für alle
      pct += (rng() - 0.5) * 4;
      return { id, percent: Math.max(0.5, pct) };
    },
  );

  // Normalisieren auf 100 %
  const sum = raw.reduce((a, b) => a + b.percent, 0);
  const normalised = raw.map((r) => ({
    id: r.id,
    percent: (r.percent / sum) * 100,
  }));

  return normalised
    .map(({ id, percent }) => {
      const party = parties.find((p) => p.id === id)!;
      return {
        partyId: id,
        party,
        percent: Math.round(percent * 10) / 10,
        mine: id === myPartyId,
      };
    })
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

function coalitionLabel(ids: PartyId[]): string {
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
    .filter((r) => !UNCOALITABLE.includes(r.partyId))
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
  myPartyId: PartyId | null,
): ElectionRole {
  if (!myPartyId) return "opposition";
  if (results[0]?.partyId === myPartyId) return "kanzler";
  if (pickedCoalition?.partyIds.includes(myPartyId)) return "minister";
  return "opposition";
}
