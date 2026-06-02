import { BriefingDeck } from "@/components/briefing/BriefingDeck";
import { getTodayDossier } from "@/lib/dossier/load";

// Briefing rendert das heute live-publizierte Dossier aus Supabase (oder
// seedDossier als Fallback) als durchwischbares Swipe-Deck: eine Info pro Karte
// (Lage → Hintergrund → optional Bild/Short → Zahlen → Entscheidung → Folge mit
// Quellen). ISR 30 min: tagesaktuelle Updates greifen schnell, ohne dass jeder
// Request einen DB-Hit macht.
export const revalidate = 1800;

export default async function HeutePage() {
  const dossier = await getTodayDossier();
  return <BriefingDeck dossier={dossier} />;
}
