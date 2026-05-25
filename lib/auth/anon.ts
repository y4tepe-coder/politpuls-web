"use client";

import { createClient } from "@/lib/supabase/client";

// Ensures the visitor has a valid Supabase session, anonymous if no real account yet.
// Idempotent: calling it twice is a no-op once a session exists.
export async function ensureAnonymousSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    return data.session;
  }

  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`Anonymous sign-in failed: ${error.message}`);
  }
  return signInData.session;
}
