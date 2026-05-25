import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  berlinDateString,
  recordCompletion,
  type StreakState,
} from "@/lib/streak/compute";

// POST /api/streak/save
// Called after the user completes today's briefing. Updates the streak
// counters on profiles and writes an audit row to streaks.
// No-op when Supabase isn't configured yet.

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_briefing_date, streak_saves_left")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: "profile_unavailable", detail: profileError.message },
      { status: 500 },
    );
  }

  const state: StreakState = {
    current: profile.current_streak,
    longest: profile.longest_streak,
    lastDate: profile.last_briefing_date,
    savesLeft: profile.streak_saves_left,
  };

  const today = berlinDateString();
  const action = recordCompletion(state, today);

  // No-op: already recorded for today, don't double-write.
  if (action.kind === "noop") {
    return NextResponse.json({ persisted: true, ...action });
  }

  const { newState } = action;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      current_streak: newState.current,
      longest_streak: newState.longest,
      last_briefing_date: newState.lastDate,
      streak_saves_left: newState.savesLeft,
    })
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "profile_update_failed", detail: updateError.message },
      { status: 500 },
    );
  }

  const { error: logError } = await supabase.from("streaks").insert({
    user_id: user.id,
    date: today,
    event: action.kind,
  });

  if (logError) {
    return NextResponse.json(
      { error: "streak_log_failed", detail: logError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ persisted: true, ...action });
}
