import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyDecision } from "@/lib/spektrum/compute";
import type { SpektrumVector } from "@/lib/spektrum/types";
import type { ChoiceId } from "@/lib/supabase/types";

// POST /api/decision
// Body: { dossierId: string, choiceId: ChoiceId, delta: SpektrumVector }
//
// In v1 the AI-generated dossiers carry their own spektrum_delta on each choice.
// The client sends back which choice was picked plus the precomputed delta.
// We re-validate the delta against the dossier server-side in Tag 8 (once dossiers
// live in Supabase); for now we trust the client because the seed dossier is static.
//
// If Supabase env vars aren't set we compute and return the new spektrum without
// persisting, so the UI still works during local development without a DB.

export const runtime = "nodejs";

type Body = {
  dossierId: string;
  choiceId: ChoiceId;
  delta: SpektrumVector;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body.dossierId ||
    !["A", "B", "C", "D"].includes(body.choiceId) ||
    typeof body.delta?.economic !== "number" ||
    typeof body.delta?.social !== "number"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fast path: no Supabase yet, just compute against an origin point.
  if (!supabaseConfigured) {
    const before: SpektrumVector = { economic: 0, social: 0 };
    const after = applyDecision(before, body.delta);
    return NextResponse.json({ before, after, persisted: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("spektrum")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: "profile_unavailable", detail: profileError.message },
      { status: 500 },
    );
  }

  const before = profile.spektrum as SpektrumVector;
  const after = applyDecision(before, body.delta);

  // Insert decision (idempotent via unique (user_id, dossier_id) — second try returns conflict).
  const { error: decisionError } = await supabase.from("decisions").insert({
    user_id: user.id,
    dossier_id: body.dossierId,
    choice_id: body.choiceId,
    spektrum_before: before,
    spektrum_after: after,
  });

  if (decisionError && !decisionError.message.includes("duplicate")) {
    return NextResponse.json(
      { error: "decision_write_failed", detail: decisionError.message },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ spektrum: after })
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "profile_update_failed", detail: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ before, after, persisted: true });
}
