import { BriefingDeck } from "@/components/briefing/BriefingDeck";
import { getTodayDossier } from "@/lib/dossier/load";

// Briefing rendert das heute live-publizierte Dossier aus Supabase (oder
// seedDossier als Fallback) als durchwischbares Swipe-Deck: eine Info pro Karte
// (Lage → Hintergrund → optional Bild/Short → Zahlen → Entscheidung → Folge mit
// Quellen). ISR 60 s: frisch publizierte Dossiers UND nachträglich gesetzte
// Videos (publish-video.mjs) erscheinen binnen ~1 Min, ohne dass jeder Request
// einen DB-Hit macht.
export const revalidate = 60;

export default async function HeutePage() {
  const dossier = await getTodayDossier();
  return <BriefingDeck dossier={dossier} />;
}
