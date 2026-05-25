import { parties } from "./parties";
import type { Party, PartyProximity, SpektrumVector } from "./types";

export const SPEKTRUM_MIN = -100;
export const SPEKTRUM_MAX = 100;
const ASYMPTOTIC_THRESHOLD = 80;
const ASYMPTOTIC_WEIGHT = 0.5;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Returns true if the user's position on this axis is so extreme that further
// nudges in the same direction get dampened (prevents lock-in at +/-100).
function isAsymptotic(currentAxis: number, delta: number): boolean {
  if (Math.abs(currentAxis) < ASYMPTOTIC_THRESHOLD) return false;
  return Math.sign(currentAxis) === Math.sign(delta);
}

export function applyDecision(
  current: SpektrumVector,
  delta: SpektrumVector,
): SpektrumVector {
  const next: SpektrumVector = { ...current };

  for (const axis of ["economic", "social"] as const) {
    const d = delta[axis];
    const weight = isAsymptotic(current[axis], d) ? ASYMPTOTIC_WEIGHT : 1.0;
    next[axis] = clamp(current[axis] + d * weight, SPEKTRUM_MIN, SPEKTRUM_MAX);
  }

  return next;
}

// Plain Euclidean distance between two compass points.
export function distance(a: SpektrumVector, b: SpektrumVector): number {
  const de = a.economic - b.economic;
  const ds = a.social - b.social;
  return Math.sqrt(de * de + ds * ds);
}

// Maximum possible distance: from (-100,-100) to (+100,+100) = sqrt(2) * 200.
const MAX_DISTANCE = Math.sqrt(2) * (SPEKTRUM_MAX - SPEKTRUM_MIN);

// Ranks parties by closeness to the user's current position.
// Returns all 7, sorted nearest first. UI typically shows top 3.
export function partyProximity(user: SpektrumVector): PartyProximity[] {
  const results: PartyProximity[] = parties.map((party: Party) => {
    const d = distance(user, party.position);
    return {
      party,
      distance: d,
      proximity: 1 - d / MAX_DISTANCE,
    };
  });
  return results.sort((a, b) => a.distance - b.distance);
}
