import { parties } from "./parties";
import type { PartyId } from "./types";
import {
  ALL_POSITIONS,
  POSITIONS_CATALOGUE,
  type Stance,
} from "@/lib/data/positions-catalogue";

// Per-party agreement score on a 0..1 scale, computed from the user's stances
// on the 18-statement catalogue. Mirrors iOS computePartyAlignment:
//   exact match = 1.0
//   one side neutral = 0.5
//   otherwise = 0
//   score / answered = 0..1
export function computePartyAlignment(
  userStances: Record<string, Stance>,
): Record<PartyId, number> {
  const answered = ALL_POSITIONS.filter((p) => userStances[p.id] != null);
  const result = {} as Record<PartyId, number>;

  for (const party of parties) {
    if (answered.length === 0) {
      result[party.id] = 0;
      continue;
    }
    let score = 0;
    for (const item of answered) {
      const u = userStances[item.id];
      const s = item.stances[party.id];
      if (!u || !s) continue;
      if (u === s) {
        score += 1;
      } else if (u === "neutral" || s === "neutral") {
        score += 0.5;
      }
    }
    result[party.id] = score / answered.length;
  }
  return result;
}

// Per-category agreement, again 0..1, but only against the closest party in
// that category. Useful for the "Bildung: 78% Übereinstimmung mit SPD" pattern.
export function computeCategoryScores(
  userStances: Record<string, Stance>,
): Array<{
  categoryId: string;
  label: string;
  color: string;
  topPartyId: PartyId | null;
  topPartyScore: number;
  answered: number;
}> {
  return POSITIONS_CATALOGUE.map((cat) => {
    const answered = cat.items.filter((i) => userStances[i.id] != null);
    if (answered.length === 0) {
      return {
        categoryId: cat.id,
        label: cat.label,
        color: cat.color,
        topPartyId: null,
        topPartyScore: 0,
        answered: 0,
      };
    }
    let bestParty: PartyId | null = null;
    let bestScore = 0;
    for (const party of parties) {
      let s = 0;
      for (const item of answered) {
        const u = userStances[item.id];
        const ps = item.stances[party.id];
        if (!u || !ps) continue;
        if (u === ps) s += 1;
        else if (u === "neutral" || ps === "neutral") s += 0.5;
      }
      const normalised = s / answered.length;
      if (normalised > bestScore) {
        bestScore = normalised;
        bestParty = party.id;
      }
    }
    return {
      categoryId: cat.id,
      label: cat.label,
      color: cat.color,
      topPartyId: bestParty,
      topPartyScore: bestScore,
      answered: answered.length,
    };
  });
}

export function rankedPartyAlignment(
  userStances: Record<string, Stance>,
): Array<{ partyId: PartyId; score: number }> {
  const alignment = computePartyAlignment(userStances);
  return parties
    .map((p) => ({ partyId: p.id, score: alignment[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}
