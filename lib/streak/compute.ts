// Streak math in Europe/Berlin time.
// We never use the user's clock — what counts as "today" is the Berlin date
// when the briefing was completed, so a user travelling abroad can't game streaks.

const BERLIN_TZ = "Europe/Berlin";

// Returns YYYY-MM-DD for the given instant in Europe/Berlin (handles DST automatically).
export function berlinDateString(date: Date = new Date()): string {
  // Intl.DateTimeFormat with sv-SE locale gives ISO-like YYYY-MM-DD output natively.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysBetween(earlier: string, later: string): number {
  const e = new Date(`${earlier}T00:00:00Z`);
  const l = new Date(`${later}T00:00:00Z`);
  return Math.round((l.getTime() - e.getTime()) / (1000 * 60 * 60 * 24));
}

export type StreakState = {
  current: number;
  longest: number;
  lastDate: string | null;
  savesLeft: number;
};

export type StreakAction =
  | { kind: "completed"; date: string; newState: StreakState }
  | { kind: "saved"; date: string; newState: StreakState }
  | { kind: "broken"; date: string; newState: StreakState }
  | { kind: "noop"; date: string; newState: StreakState };

// Process a "user completed today's briefing" event.
// Pure function: takes current state + today's date, returns action + new state.
// Rules:
//   - Same day: noop (already counted)
//   - +1 day:   streak++, possibly new longest
//   - +2 days:  ONE save available → consume save, treat as continued; else broken→reset to 1
//   - >2 days:  always broken, reset to 1
//   - First completion ever: streak = 1
export function recordCompletion(
  state: StreakState,
  today: string = berlinDateString(),
): StreakAction {
  if (!state.lastDate) {
    return {
      kind: "completed",
      date: today,
      newState: {
        current: 1,
        longest: Math.max(state.longest, 1),
        lastDate: today,
        savesLeft: state.savesLeft,
      },
    };
  }

  const gap = daysBetween(state.lastDate, today);

  if (gap === 0) {
    return { kind: "noop", date: today, newState: state };
  }

  if (gap === 1) {
    const next = state.current + 1;
    return {
      kind: "completed",
      date: today,
      newState: {
        current: next,
        longest: Math.max(state.longest, next),
        lastDate: today,
        savesLeft: state.savesLeft,
      },
    };
  }

  if (gap === 2 && state.savesLeft > 0) {
    const next = state.current + 1;
    return {
      kind: "saved",
      date: today,
      newState: {
        current: next,
        longest: Math.max(state.longest, next),
        lastDate: today,
        savesLeft: state.savesLeft - 1,
      },
    };
  }

  return {
    kind: "broken",
    date: today,
    newState: {
      current: 1,
      longest: state.longest,
      lastDate: today,
      // Earn back one save when a streak resets, so the user always has a safety net.
      savesLeft: 1,
    },
  };
}
