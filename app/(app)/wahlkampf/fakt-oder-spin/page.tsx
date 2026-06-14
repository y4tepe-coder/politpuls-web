"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FAKT_SPIN_CLAIMS } from "@/lib/data/fakt-oder-spin";
import { updateLocalState } from "@/lib/local/state";
import { markBriefingDoneLocally } from "@/lib/local/streak";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CircleAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";

// Session: deterministic — nimm die ersten 5 Claims.
// Kein Math.random() auf Modul-Ebene (SSR-sicher).
const SESSION_CLAIMS = FAKT_SPIN_CLAIMS.slice(0, 5);
const TOTAL = SESSION_CLAIMS.length;

type Answer = "fakt" | "spin";

export default function FaktOderSpinPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // answers[i] = was the user's answer correct?
  const [correctCount, setCorrectCount] = useState(0);
  // combo = consecutive correct answers
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [finished, setFinished] = useState(false);
  // which answer did the user pick for current card?
  const [picked, setPicked] = useState<Answer | null>(null);

  function pick(answer: Answer) {
    if (revealed) return;
    const claim = SESSION_CLAIMS[index];
    const isCorrect =
      (answer === "fakt" && claim.isFakt) ||
      (answer === "spin" && !claim.isFakt);

    setPicked(answer);
    setRevealed(true);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
    } else {
      setCombo(0);
    }
  }

  function next() {
    if (index + 1 >= TOTAL) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setPicked(null);
    }
  }

  function finish() {
    updateLocalState({ campaign_faktspin_done: true });
    markBriefingDoneLocally();
    router.push("/wahlkampf");
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((correctCount / TOTAL) * 100);
    const debrief =
      correctCount >= 4
        ? "Starke Leistung — du erkennst Spin zuverlässig. Achte weiter auf fehlenden Kontext und schiefe Vergleiche."
        : correctCount >= 3
          ? "Guter Ansatz — bei einigen Techniken lohnt ein zweiter Blick, besonders Strohmann und Whataboutism."
          : "Medienkompetenz braucht Übung — frag dich bei jeder Aussage: Wer sagt das, mit welcher Quelle?";

    return (
      <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-7 items-center text-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="glass-card inline-flex items-center justify-center size-20 rounded-full"
        >
          <Trophy className="size-10 text-foreground" />
        </motion.div>

        <header className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em] text-on-bg">
            Auswertung · Fakt oder Spin?
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-on-bg">
            {correctCount}/{TOTAL} erkannt
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto text-on-bg">
            <span className="font-mono font-semibold">{pct} %</span>
            {maxCombo >= 3 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[var(--pp-red)]">
                <Sparkles className="size-3.5" />
                {maxCombo}er Combo
              </span>
            )}
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="glass-card rounded-2xl px-6 py-4 max-w-sm text-sm leading-relaxed text-foreground"
        >
          {debrief}
        </motion.div>

        <div className="flex flex-col gap-2 w-full max-w-sm">
          <Button
            onClick={finish}
            size="lg"
            className="h-12 group"
          >
            Weiter zum Wahlkampf
            <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </main>
    );
  }

  // ── Claim card ────────────────────────────────────────────────────────────
  const claim = SESSION_CLAIMS[index];
  const progress = ((index + 1) / TOTAL) * 100;
  const isCorrect =
    picked !== null &&
    ((picked === "fakt" && claim.isFakt) ||
      (picked === "spin" && !claim.isFakt));

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-6">
      {/* ── Header nav + progress ── */}
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/wahlkampf"
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Zurück zum Wahlkampf"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xs">
          <div className="h-1.5 w-full rounded-full bg-foreground/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            Aussage {index + 1} / {TOTAL}
          </span>
        </div>
        {/* Combo badge */}
        <div className="w-11 flex justify-end">
          {combo >= 2 && (
            <motion.span
              key={combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full glass-card text-[var(--pp-red)]"
            >
              <Sparkles className="size-3" />
              {combo}x
            </motion.span>
          )}
        </div>
      </header>

      {/* ── Eyebrow + Title ── */}
      <div className="flex flex-col gap-1 text-on-bg">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Wahlkampf · Medienkompetenz
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
          Fakt oder Spin?
        </h1>
        <p className="text-sm text-muted-foreground">
          Entscheide, ob die Aussage einem Faktencheck standhält oder eine
          Manipulationstechnik verwendet.
        </p>
      </div>

      {/* ── Claim card + reveal ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={claim.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.28 }}
          className="flex flex-col gap-4"
        >
          {/* Claim text */}
          <div className="glass-card rounded-2xl p-5">
            <p className="font-serif text-lg sm:text-xl leading-snug text-foreground">
              „{claim.text}"
            </p>
          </div>

          {/* Answer buttons — hidden once revealed */}
          {!revealed && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => pick("fakt")}
                className="glass-card group rounded-2xl p-4 flex flex-col items-center gap-2.5 hover:bg-success/10 hover:border-success/30 transition-all min-h-[90px] border-2 border-transparent"
              >
                <CircleCheck className="size-7 text-success" />
                <span className="font-semibold text-sm text-foreground">Fakt</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  sachlich und belegbar
                </span>
              </button>
              <button
                type="button"
                onClick={() => pick("spin")}
                className="glass-card group rounded-2xl p-4 flex flex-col items-center gap-2.5 hover:bg-destructive/10 hover:border-destructive/30 transition-all min-h-[90px] border-2 border-transparent"
              >
                <CircleAlert className="size-7 text-destructive" />
                <span className="font-semibold text-sm text-foreground">Spin</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  Manipulation oder fehlender Kontext
                </span>
              </button>
            </div>
          )}

          {/* Reveal panel */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3"
              >
                {/* Correct / Wrong badge */}
                <div
                  className={`glass-card rounded-2xl p-4 flex items-start gap-3 ${
                    isCorrect
                      ? "border-success/30 bg-success/8"
                      : "border-foreground/15"
                  }`}
                >
                  {isCorrect ? (
                    <CircleCheck className="size-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <CircleAlert className="size-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isCorrect ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isCorrect ? "Richtig!" : "Knapp daneben."}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {claim.isFakt ? "→ Fakt" : "→ Spin"}
                      </span>
                      {!claim.isFakt && claim.technik && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-foreground/8 text-xs font-medium text-foreground">
                          {claim.technik}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {claim.aufloesung}
                    </p>
                  </div>
                </div>

                {/* Next / Finish */}
                <button
                  type="button"
                  onClick={next}
                  className={
                    buttonVariants({ size: "lg" }) +
                    " h-12 w-full group"
                  }
                >
                  {index + 1 >= TOTAL ? "Auswertung sehen" : "Weiter"}
                  <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <footer className="text-center text-xs text-muted-foreground mt-auto pt-2">
        Alle Aussagen dienen der Medienkompetenz-Schulung · keine Parteiempfehlung
      </footer>
    </main>
  );
}
