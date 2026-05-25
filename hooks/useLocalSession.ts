"use client";

import { useEffect, useState } from "react";
import {
  ensureLocalSession,
  getLocalSession,
  type LocalSession,
} from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";

// Returns the local session + state, creating an anonymous session on first
// visit. SSR-safe: returns null on the server and during the initial client
// render to avoid hydration mismatches.
export function useLocalSession(autoCreate: boolean = false) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [state, setState] = useState<LocalState | null>(null);

  useEffect(() => {
    const s = autoCreate ? ensureLocalSession() : getLocalSession();
    setSession(s);
    setState(getLocalState());
  }, [autoCreate]);

  return { session, state, refresh: () => {
    setSession(getLocalSession());
    setState(getLocalState());
  } };
}
