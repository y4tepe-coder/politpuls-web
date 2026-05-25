"use client";

import { berlinDateString, recordCompletion, type StreakState } from "@/lib/streak/compute";
import { getLocalState, updateLocalState } from "./state";

// Updates the locally-stored streak after the user finishes today's briefing.
// Wraps the pure streak/compute module so the UI just calls one function.
export function markBriefingDoneLocally(): {
  current: number;
  longest: number;
  savesLeft: number;
  kind: "completed" | "saved" | "broken" | "noop";
} {
  const state = getLocalState();
  const today = berlinDateString();

  const stateForCompute: StreakState = {
    current: state.current_streak,
    longest: state.longest_streak,
    lastDate: state.last_briefing_date,
    savesLeft: state.streak_saves_left,
  };

  const action = recordCompletion(stateForCompute, today);
  if (action.kind === "noop") {
    return {
      current: stateForCompute.current,
      longest: stateForCompute.longest,
      savesLeft: stateForCompute.savesLeft,
      kind: "noop",
    };
  }

  const next = action.newState;
  updateLocalState({
    current_streak: next.current,
    longest_streak: next.longest,
    last_briefing_date: next.lastDate,
    streak_saves_left: next.savesLeft,
  });

  return {
    current: next.current,
    longest: next.longest,
    savesLeft: next.savesLeft,
    kind: action.kind,
  };
}
