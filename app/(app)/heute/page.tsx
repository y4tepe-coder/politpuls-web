import { BriefingFlow } from "@/components/briefing/BriefingFlow";
import { getTodayDossier } from "@/lib/dossier/load";

// Briefing rendert das heute live-publizierte Dossier aus Supabase
// (oder seedDossier als Fallback). ISR 30 min: tagesaktuelle Updates
// greifen schnell, ohne dass jeder Request einen DB-Hit macht.
export const revalidate = 1800;

export default async function HeutePage() {
  const dossier = await getTodayDossier();
  return <BriefingFlow dossier={dossier} />;
}
