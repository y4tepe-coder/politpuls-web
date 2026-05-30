import { NextResponse } from "next/server";
import { getTodayDossier } from "@/lib/dossier/load";

// Kleiner Endpunkt, damit die (client-seitige) Startseite das ECHTE Tages-
// Dossier kennt (Headline + Kicker für Hero und Pfad-Knoten), statt den Seed
// hart zu verdrahten. Liest serverseitig über getTodayDossier().
export const dynamic = "force-dynamic";

export async function GET() {
  const d = await getTodayDossier();
  return NextResponse.json({
    kicker: d.kicker,
    headline: d.headline,
    slug: d.slug,
    publish_date: d.publish_date,
  });
}
