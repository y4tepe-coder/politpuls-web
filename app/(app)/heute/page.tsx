import { BriefingArticle } from "@/components/briefing/BriefingArticle";
import { getTodayDossier } from "@/lib/dossier/load";

// Briefing rendert das heute live-publizierte Dossier aus Supabase
// (oder seedDossier als Fallback) als scrollbaren Artikel. Das Tagesformat
// (Entscheidung / Reporter-Chat / Koalition / Plakat) entscheidet, welcher
// interaktive Schritt eingebettet ist. ISR 30 min: tagesaktuelle Updates
// greifen schnell, ohne dass jeder Request einen DB-Hit macht.
export const revalidate = 1800;

export default async function HeutePage() {
  const dossier = await getTodayDossier();
  return <BriefingArticle dossier={dossier} />;
}
