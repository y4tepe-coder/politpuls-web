"use client";

import type { SpektrumVector } from "@/lib/spektrum/types";
import type { Stance } from "@/lib/data/positions-catalogue";

// Browser-local game state. Mirrors what would live on the Supabase profiles
// row when the user is signed in. Source of truth when offline.

export type LocalDecision = {
  dossierId: string;
  choiceId: string;
  date: string;
  spektrumBefore: SpektrumVector;
  spektrumAfter: SpektrumVector;
};

export type LocalRole = "kandidat" | "minister" | "kanzler" | "opposition";

export type LocalState = {
  spektrum: SpektrumVector;
  current_streak: number;
  longest_streak: number;
  last_briefing_date: string | null;
  streak_saves_left: number;
  decisions: LocalDecision[];
  role: LocalRole;
  party_id: string | null;
  // Werte-Check Antworten (id → stance). Leer bis User /werte-check macht.
  positions: Record<string, Stance>;
};

const KEY = "politpuls.state.v1";

const DEFAULT_STATE: LocalState = {
  spektrum: { economic: 0, social: 0 },
  current_streak: 0,
  longest_streak: 0,
  last_briefing_date: null,
  streak_saves_left: 1,
  decisions: [],
  role: "kandidat",
  party_id: null,
  positions: {},
};

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getLocalState(): LocalState {
  const storage = safeStorage();
  if (!storage) return DEFAULT_STATE;
  const raw = storage.getItem(KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function updateLocalState(updates: Partial<LocalState>): LocalState {
  const existing = getLocalState();
  const updated: LocalState = { ...existing, ...updates };
  const storage = safeStorage();
  if (storage) storage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function appendLocalDecision(decision: LocalDecision): LocalState {
  const existing = getLocalState();
  // Replace if same dossier was already decided (idempotent).
  const others = existing.decisions.filter(
    (d) => d.dossierId !== decision.dossierId,
  );
  return updateLocalState({
    spektrum: decision.spektrumAfter,
    decisions: [...others, decision],
  });
}

export function resetLocalState() {
  const storage = safeStorage();
  if (storage) storage.removeItem(KEY);
}
