import { BriefingFlow } from "@/components/briefing/BriefingFlow";
import { seedDossier } from "@/lib/data/seed-dossier";

// Daily briefing page. Tag 3 wires up the static seed dossier client-side.
// Tag 8+ will load the live dossier from Supabase based on today's Berlin date.
export default function HeutePage() {
  return <BriefingFlow dossier={seedDossier} />;
}
