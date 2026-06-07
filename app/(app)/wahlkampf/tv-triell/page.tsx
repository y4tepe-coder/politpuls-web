"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TV_TRIELL_FRAGEN } from "@/lib/data/tv-triell";
import { getLocalState, updateLocalState } from "@/lib/local/state";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Tv,
  Trophy,
  CircleUserRound,
} from "lucide-react";
import Link from "next/link";

// 5-Fragen TV-Triell — klare Hierarchie:
// [topic pill + moderator] → [Frage] → "Was sagen die anderen" (2 chat bubbles)
// → "Deine Antwort" (3 große CTA buttons).

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
          className="glass-card inline-flex items-center justify-center size-20 rounded-full"
        >
          <Trophy className="size-10 text-foreground" />
        </motion.div>
        <header className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
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
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-6">
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={back}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
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
          className="flex flex-col gap-6"
        >
          {/* Topic + Moderator (klein, zweizeilig oben) */}
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center size-10 rounded-xl glass-card shrink-0">
              <Tv className="size-5 text-foreground" />
            </span>
            <div className="flex flex-col gap-0.5 leading-tight text-on-bg">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {frage.topic} · TV-Studio
              </span>
              <span className="text-sm font-medium text-foreground/70">
                Moderation: {frage.moderator}
              </span>
            </div>
          </div>

          {/* Hauptfrage */}
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug text-on-bg">
            {frage.question}
          </h2>

          {/* Was sagen die anderen — beide Gegner als einheitliche Karten
              (kein Chat-Links/Rechts-Spiel mehr → übersichtlicher). */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground text-on-bg">
              Was sagen die anderen
            </h3>
            <div className="flex flex-col gap-3">
              <OpponentBubble {...frage.opponentA} />
              <OpponentBubble {...frage.opponentB} />
            </div>
          </section>

          {/* Deine Antwort — visuell deutlich separiert */}
          <section className="flex flex-col gap-3 pt-2 border-t border-foreground/8">
            <header className="flex items-center gap-2">
              <CircleUserRound className="size-5 text-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                Du bist dran
              </h3>
            </header>
            <ul className="flex flex-col gap-2.5">
              {frage.answers.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => pick(a.id)}
                    className="glass-card group w-full text-left rounded-2xl p-4 hover:bg-foreground/5 hover:border-foreground/20 transition-all min-h-[60px] flex items-center gap-3"
                  >
                    <span className="inline-flex items-center justify-center size-8 rounded-full bg-foreground text-background font-mono text-sm font-bold uppercase shrink-0">
                      {a.id}
                    </span>
                    <span className="font-medium leading-snug flex-1">
                      {a.label}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </motion.div>
      </AnimatePresence>

      <footer className="text-center text-xs text-muted-foreground mt-2">
        Antworten werden gespeichert · du kannst zurück & ändern
      </footer>
    </main>
  );
}

// Einheitliche, links ausgerichtete Gegner-Karte (beide gleich) — statt
// Chat-Blasen links/rechts, die nur Unruhe ohne Mehrwert brachten.
function OpponentBubble({
  name,
  party,
  statement,
}: {
  name: string;
  party: string;
  statement: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center size-8 rounded-full bg-foreground text-background font-mono text-xs font-bold shrink-0">
          {initials}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">{party}</span>
        </div>
      </div>
      <p className="text-[15px] leading-snug text-foreground">{`„${statement}“`}</p>
    </div>
  );
}
