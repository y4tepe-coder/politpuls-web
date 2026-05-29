"use client";

import { useEffect, useState } from "react";
import type { ChoiceId, Dossier } from "@/lib/supabase/types";
import type { SpektrumVector } from "@/lib/spektrum/types";
import { applyDecision } from "@/lib/spektrum/compute";
import { appendLocalDecision, getLocalState } from "@/lib/local/state";
import { ensureLocalSession } from "@/lib/local/session";
import { markBriefingDoneLocally } from "@/lib/local/streak";

// Shared decision logic for every daily pattern (extracted from BriefingFlow).
// LocalStorage is the source of truth; the server (Supabase) is best-effort.
export function useDecision(dossier: Dossier) {
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

  useEffect(() => {
    ensureLocalSession();
    const local = getLocalState();
    setSpektrumBefore(local.spektrum);
    setSpektrumAfter(local.spektrum);
  }, []);

  const chosen = chosenId
    ? dossier.choices.find((c) => c.id === chosenId) ?? null
    : null;
  const consequence = chosenId ? dossier.consequences[chosenId] ?? null : null;

  async function choose(id: ChoiceId) {
    const choice = dossier.choices.find((c) => c.id === id);
    if (!choice || submitting || chosenId) return;

    setSubmitting(true);
    setChosenId(id);

    const before = getLocalState().spektrum;
    const after = applyDecision(before, choice.spektrum_delta);

    appendLocalDecision({
      dossierId: dossier.id,
      choiceId: id,
      date: new Date().toISOString(),
      spektrumBefore: before,
      spektrumAfter: after,
      indicatorDeltas: choice.deltas?.map((d) => ({
        label: d.label,
        delta: d.delta,
        unit: d.unit,
        good: d.good,
      })),
    });
    markBriefingDoneLocally();

    setSpektrumBefore(before);
    setSpektrumAfter(after);

    try {
      const [decisionRes] = await Promise.all([
        fetch("/api/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dossierId: dossier.id,
            choiceId: id,
            delta: choice.spektrum_delta,
          }),
        }),
        fetch("/api/streak/save", { method: "POST" }).catch(() => null),
      ]);

      if (decisionRes.ok) {
        const data = (await decisionRes.json()) as {
          before: SpektrumVector;
          after: SpektrumVector;
          persisted?: boolean;
        };
        if (data.persisted) {
          setSpektrumBefore(data.before);
          setSpektrumAfter(data.after);
        }
      }
    } catch {
      // Local state already updated; skip server.
    } finally {
      setSubmitting(false);
    }
  }

  return {
    chosenId,
    chosen,
    consequence,
    spektrumBefore,
    spektrumAfter,
    submitting,
    choose,
  };
}
