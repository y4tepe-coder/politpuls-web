"use client";

// Browser-local "session" used when Supabase is not configured (or while we wait
// for Supabase to come online). Behaves like a tiny anonymous-by-default auth:
// every visitor gets a generated user id on first visit; they can optionally
// upgrade by entering a name + email, which we store locally too.
//
// When Supabase comes online later we'll migrate the local state into the real
// profiles row keyed by user_id.

export type LocalSession = {
  userId: string;
  displayName: string | null;
  email: string | null;
  isRegistered: boolean;
  createdAt: string;
};

const KEY = "politpuls.session.v1";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getLocalSession(): LocalSession | null {
  const storage = safeStorage();
  if (!storage) return null;
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function ensureLocalSession(): LocalSession {
  const existing = getLocalSession();
  if (existing) return existing;

  const session: LocalSession = {
    userId: `local-${randomId()}`,
    displayName: null,
    email: null,
    isRegistered: false,
    createdAt: new Date().toISOString(),
  };
  const storage = safeStorage();
  if (storage) storage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function updateLocalSession(
  updates: Partial<Omit<LocalSession, "userId" | "createdAt">>,
): LocalSession {
  const existing = ensureLocalSession();
  const updated: LocalSession = { ...existing, ...updates };
  const storage = safeStorage();
  if (storage) storage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function registerLocally(displayName: string, email: string): LocalSession {
  return updateLocalSession({
    displayName: displayName.trim() || null,
    email: email.trim() || null,
    isRegistered: true,
  });
}

export function clearLocalSession() {
  const storage = safeStorage();
  if (storage) storage.removeItem(KEY);
}
