import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/profile
// Body: { role?: string, party_id?: string | null }
//
// Persistiert den Simulator-Status (Rolle + gewählte Partei) auf die profiles-Row.
// Wird nach der Wahl (Rolle steht fest) und im Onboarding (Partei gewählt)
// best-effort aufgerufen. localStorage bleibt Source of Truth; Supabase macht
// den Fortschritt geräteübergreifend haltbar.
//
// Ohne Supabase-Env-Vars (lokale Entwicklung) wird nichts persistiert, aber
// 200 zurückgegeben, damit die UI nicht stolpert.

export const runtime = "nodejs";

const VALID_ROLES = ["kandidat", "opposition", "minister", "kanzler"] as const;
type Role = (typeof VALID_ROLES)[number];

type Body = {
  role?: string;
  party_id?: string | null;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const updates: { role?: Role; party_id?: string | null } = {};

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role as Role)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }
    updates.role = body.role as Role;
  }

  if (body.party_id !== undefined) {
    if (body.party_id !== null && typeof body.party_id !== "string") {
      return NextResponse.json({ error: "invalid_party_id" }, { status: 400 });
    }
    updates.party_id = body.party_id;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fast path: keine DB konfiguriert — nichts zu persistieren.
  if (!supabaseConfigured) {
    return NextResponse.json({ persisted: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("profile: Update fehlgeschlagen:", updateError.message);
    return NextResponse.json({ error: "profile_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ persisted: true });
}
