import { NextResponse } from "next/server";

import { todayBerlinISO } from "@/lib/dossier/load";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// TEMPORÄRER Diagnose-Endpunkt: zeigt, was die laufende App auf dem Server
// tatsächlich sieht (welche Zugangsdaten, ob der Supabase-Fetch von Hostinger aus
// klappt, welche Env-Variablen gesetzt sind). Keine Geheimnisse — nur die letzten
// 6 Zeichen der Keys. Wird nach der Diagnose wieder entfernt.
export const dynamic = "force-dynamic";

export async function GET() {
  const date = todayBerlinISO();
  const result: Record<string, unknown> = {
    date,
    usingUrl: SUPABASE_URL,
    usingKeyTail: SUPABASE_ANON_KEY.slice(-6),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_set:
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NEXT_PUBLIC_SUPABASE_ANON_KEY_tail:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-6) ?? null,
      SUPABASE_URL: process.env.SUPABASE_URL ?? null,
      SUPABASE_ANON_KEY_set: Boolean(process.env.SUPABASE_ANON_KEY),
    },
  };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/dossiers?select=publish_date,slug,headline&published=eq.true&publish_date=lte.${date}&order=publish_date.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      },
    );
    result.fetchStatus = res.status;
    result.fetchOk = res.ok;
    result.body = (await res.text()).slice(0, 400);
  } catch (e) {
    result.fetchError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result);
}
