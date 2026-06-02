import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Endpunkt fürs "Was meinst du?"-Voting. Liest/speichert echte Stimmen über die
// SECURITY-DEFINER-RPCs meinung_tally / meinung_vote (siehe Migration
// add_meinung_faktencheck_formats_and_votes). Der anon-Key reicht — die
// Funktionen kapseln den Zugriff, Roh-Stimmen sind nie direkt lesbar.
export const dynamic = "force-dynamic";

type Tally = {
  total: number;
  options: { option_id: string; votes: number }[];
  my_choice: string | null;
};

const EMPTY: Tally = { total: 0, options: [], my_choice: null };

async function callRpc(fn: string, body: Record<string, unknown>): Promise<Tally> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`rpc ${fn} failed: ${res.status}`);
  const data = (await res.json()) as Tally;
  return data ?? EMPTY;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const voter = url.searchParams.get("voter");
  if (!DATE_RE.test(date)) {
    return NextResponse.json(EMPTY, { status: 400 });
  }
  try {
    const tally = await callRpc("meinung_tally", { p_date: date, p_voter: voter });
    return NextResponse.json(tally);
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}

export async function POST(request: Request) {
  let body: { date?: string; option?: string; voter?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(EMPTY, { status: 400 });
  }
  const { date, option, voter } = body;
  if (
    !date || !DATE_RE.test(date) ||
    !option || option.length > 20 ||
    !voter || voter.length > 100
  ) {
    return NextResponse.json(EMPTY, { status: 400 });
  }
  try {
    const tally = await callRpc("meinung_vote", {
      p_date: date,
      p_option: option,
      p_voter: voter,
    });
    return NextResponse.json(tally);
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
