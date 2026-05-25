"use client";

import { useEffect, useState } from "react";
import type { ChoiceId, Dossier } from "@/lib/supabase/types";
import type { SpektrumVector } from "@/lib/spektrum/types";
import { applyDecision } from "@/lib/spektrum/compute";
import { appendLocalDecision, getLocalState } from "@/lib/local/state";
import { ensureLocalSession } from "@/lib/local/session";
import { markBriefingDoneLocally } from "@/lib/local/streak";
import { BriefingCard } from "./BriefingCard";
import { FactsCard } from "./FactsCard";
import { ChoiceCard } from "./ChoiceCard";
import { ConsequenceCard } from "./ConsequenceCard";

type Step = "briefing" | "facts" | "choice" | "consequence";

type Props = {
  dossier: Dossier;
};

// Drives the four-card daily flow.
// Source of truth = local state (LocalStorage). We also POST to /api/decision
// best-effort; once Supabase is configured the server will persist too.
export function BriefingFlow({ dossier }: Props) {
  const [step, setStep] = useState<Step>("briefing");
  const [chosenId, setChosenId] = useState<ChoiceId | null>(null);
  const [spektrumBefore, setSpektrumBefore] = useState<SpektrumVector>({
    economic: 0,
    social: 0,
  });
  const [spektrumAfter, setSpektrumAfter] = useState<SpektrumVector>({
    economic: 0,
    social: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from LocalStorage on mount (skips SSR to avoid hydration mismatch).
  useEffect(() => {
    ensureLocalSession();
    const local = getLocalState();
    setSpektrumBefore(local.spektrum);
    setSpektrumAfter(local.spektrum);
  }, []);

  const chosen = chosenId
    ? dossier.choices.find((c) => c.id === chosenId)
    : null;
  const consequence = chosenId ? dossier.consequences[chosenId] : null;

  async function handleChoose(id: ChoiceId) {
    const choice = dossier.choices.find((c) => c.id === id);
    if (!choice || submitting) return;

    setSubmitting(true);
    setChosenId(id);

    const before = getLocalState().spektrum;
    const after = applyDecision(before, choice.spektrum_delta);

    // Persist locally first — that's the offline-safe truth.
    appendLocalDecision({
      dossierId: dossier.id,
      choiceId: id,
      date: new Date().toISOString(),
      spektrumBefore: before,
      spektrumAfter: after,
    });
    markBriefingDoneLocally();

    setSpektrumBefore(before);
    setSpektrumAfter(after);

    // Best-effort server sync. If Supabase is configured the server overwrites
    // our local "after" with the canonical value (e.g. profile already had drift).
    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: dossier.id,
          choiceId: id,
          delta: choice.spektrum_delta,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          before: SpektrumVector;
          after: SpektrumVector;
          persisted?: boolean;
        };
        if (data.persisted) {
          setSpektrumBefore(data.before);
          setSpektrumAfter(data.after);
        }
      }

      // Streak save is fire-and-forget — local already happened.
      fetch("/api/streak/save", { method: "POST" }).catch(() => null);
    } catch {
      // Already updated locally; nothing to do.
    } finally {
      setSubmitting(false);
      setStep("consequence");
    }
  }

  function handleRestart() {
    setStep("briefing");
    setChosenId(null);
    const local = getLocalState();
    setSpektrumBefore(local.spektrum);
    setSpektrumAfter(local.spektrum);
  }

  if (step === "briefing") {
    return (
      <BriefingCard
        kicker={dossier.kicker}
        headline={dossier.headline}
        deck={dossier.deck}
        onContinue={() => setStep("facts")}
      />
    );
  }

  if (step === "facts") {
    return <FactsCard facts={dossier.facts} onContinue={() => setStep("choice")} />;
  }

  if (step === "choice") {
    return (
      <ChoiceCard
        streitfrage={dossier.streitfrage}
        choices={dossier.choices}
        onChoose={handleChoose}
      />
    );
  }

  if (step === "consequence" && chosen && consequence) {
    return (
      <ConsequenceCard
        choice={chosen}
        consequence={consequence}
        spektrumBefore={spektrumBefore}
        spektrumAfter={spektrumAfter}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}
