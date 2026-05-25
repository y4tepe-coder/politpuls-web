"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TV_TRIELL_FRAGEN } from "@/lib/data/tv-triell";
import { getLocalState, updateLocalState } from "@/lib/local/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Tv, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

// 5-Fragen TV-Triell. Pro Frage zeigt: Topic + Moderator + Gegner-Statements,
// dann der User pickt eine von drei Antworten. Score wird über Antwort-
// Popularität summiert. Am Ende: Score-Reveal.

export default function TvTriellPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const local = getLocalState();
    setAnswers(local.campaign_triell_answers ?? {});
    const firstUnanswered = TV_TRIELL_FRAGEN.findIndex(
      (f) => !(local.campaign_triell_answers ?? {})[f.id],
    );
    setIndex(firstUnanswered === -1 ? TV_TRIELL_FRAGEN.length : firstUnanswered);
    setFinished(firstUnanswered === -1);
    setHydrated(true);
  }, []);

  if (!hydrated) return <div className="flex-1" />;

  function pick(answerId: string) {
    const frage = TV_TRIELL_FRAGEN[index];
    const next = { ...answers, [frage.id]: answerId };
    setAnswers(next);
    updateLocalState({ campaign_triell_answers: next });
    if (index + 1 >= TV_TRIELL_FRAGEN.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  function back() {
    if (index === 0) {
      router.push("/wahlkampf");
      return;
    }
    setIndex(index - 1);
  }

  if (finished) {
    // Compute score
    const score = TV_TRIELL_FRAGEN.reduce((sum, f) => {
      const aId = answers[f.id];
      const a = f.answers.find((x) => x.id === aId);
      return sum + (a?.popularity ?? 0);
    }, 0);
    const verdict =
      score >= 20
        ? "Triumph — du hast die Runde geprägt."
        : score >= 10
          ? "Solide Leistung — du wirst wahrgenommen."
          : score >= 0
            ? "Knapp — du musst noch nachlegen."
            : "Schwierig — du hast Stimmen verloren.";
    return (
      <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-7 items-center text-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center size-20 rounded-full bg-pastel-sky"
        >
          <Trophy className="size-10 text-pastel-sky-ink" />
        </motion.div>
        <header className="flex flex-col gap-2">
          <span className="text-pastel-sky-ink text-[11px] font-semibold uppercase tracking-[0.18em]">
            TV-Triell beendet
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            {verdict}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Score: <span className="font-mono font-semibold">{score > 0 ? "+" : ""}{score}</span>
            {" "}— summiert aus deinen 5 Antworten.
          </p>
        </header>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <Link
            href="/wahlkampf/wahl"
            className={buttonVariants({ size: "lg" }) + " h-12 group"}
          >
            Zum Wahlsonntag
            <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setFinished(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Triell neu führen
          </button>
        </div>
      </main>
    );
  }

  const frage = TV_TRIELL_FRAGEN[index];
  const total = TV_TRIELL_FRAGEN.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xs">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-pastel-sky-ink"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            Frage {index + 1} / {total}
          </span>
        </div>
        <div className="w-11" />
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={frage.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-5"
        >
          {/* Studio header */}
          <div className="rounded-2xl bg-pastel-sky border border-pastel-sky-ink/15 text-pastel-sky-ink p-4 flex items-center gap-3">
            <Tv className="size-5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
                {frage.topic} · Moderation
              </span>
              <span className="font-serif font-semibold leading-tight">
                {frage.moderator}
              </span>
            </div>
          </div>

          {/* Question */}
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
            {frage.question}
          </h2>

          {/* Opponent statements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OpponentBubble
              tone="rose"
              name={frage.opponentA.name}
              party={frage.opponentA.party}
              statement={frage.opponentA.statement}
            />
            <OpponentBubble
              tone="peach"
              name={frage.opponentB.name}
              party={frage.opponentB.party}
              statement={frage.opponentB.statement}
            />
          </div>

          {/* User answers */}
          <div className="flex flex-col gap-2.5 mt-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pastel-mint-ink">
              Deine Antwort
            </span>
            {frage.answers.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pick(a.id)}
                className="group w-full text-left rounded-2xl border-2 border-pastel-mint-ink/15 bg-pastel-mint text-pastel-mint-ink p-4 hover:shadow-md transition-all min-h-[60px] flex items-center gap-3"
              >
                <span className="inline-flex items-center justify-center size-8 rounded-full bg-pastel-mint-ink text-pastel-mint font-mono text-sm font-bold uppercase shrink-0">
                  {a.id}
                </span>
                <span className="font-medium leading-snug flex-1">
                  {a.label}
                </span>
                <ArrowRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <footer className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
        <Sparkles className="size-3.5 text-pastel-peach-ink" />
        Antworten werden gespeichert, du kannst zurück & ändern.
      </footer>
    </main>
  );
}

function OpponentBubble({
  tone,
  name,
  party,
  statement,
}: {
  tone: "rose" | "peach";
  name: string;
  party: string;
  statement: string;
}) {
  const styles =
    tone === "rose"
      ? "bg-pastel-rose border-pastel-rose-ink/15 text-pastel-rose-ink"
      : "bg-pastel-peach border-pastel-peach-ink/15 text-pastel-peach-ink";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className={`rounded-2xl border p-3.5 flex flex-col gap-2 ${styles}`}>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center size-7 rounded-full bg-card text-foreground font-mono text-xs font-bold">
          {initials}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold">{name}</span>
          <span className="text-[10px] opacity-80">{party}</span>
        </div>
      </div>
      <p className="text-sm leading-snug">"{statement}"</p>
    </div>
  );
}
