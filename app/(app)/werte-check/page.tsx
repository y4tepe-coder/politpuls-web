"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ALL_POSITIONS,
  POSITIONS_CATALOGUE,
  type Stance,
} from "@/lib/data/positions-catalogue";
import { getLocalState, updateLocalState } from "@/lib/local/state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Check,
  Minus,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// 18-statement Werte-Check. One statement per screen with ja / neutral / nein.
// Saves to local state.positions immediately on each tap so progress survives
// reloads. After the last statement, routes to /profil where the alignment shows.
export default function WerteCheckPage() {
  const router = useRouter();
  const [stances, setStances] = useState<Record<string, Stance>>({});
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const local = getLocalState();
    setStances(local.positions ?? {});
    // Start at first unanswered question for resume-friendly UX.
    const firstUnanswered = ALL_POSITIONS.findIndex(
      (p) => !(local.positions ?? {})[p.id],
    );
    setIndex(firstUnanswered === -1 ? ALL_POSITIONS.length : firstUnanswered);
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex flex-1 items-center justify-center" />;
  }

  const total = ALL_POSITIONS.length;
  const isFinished = index >= total;

  function pick(s: Stance) {
    const item = ALL_POSITIONS[index];
    if (!item) return;
    const next = { ...stances, [item.id]: s };
    setStances(next);
    updateLocalState({ positions: next });
    setIndex((i) => i + 1);
  }

  function back() {
    if (index === 0) {
      router.back();
      return;
    }
    setIndex((i) => i - 1);
  }

  if (isFinished) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center gap-7">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center size-20 rounded-full bg-success/15 text-success"
        >
          <Sparkles className="size-10" />
        </motion.div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Werte-Check abgeschlossen.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm leading-relaxed">
          Jetzt zeigt dein Profil, welche Partei dir am nächsten steht und wo
          ihr euch über die sechs Themenfelder verteilt seid.
        </p>
        <Link
          href="/profil"
          className={buttonVariants({ size: "lg" }) + " h-12 px-8"}
        >
          Mein Profil ansehen
        </Link>
      </main>
    );
  }

  const item = ALL_POSITIONS[index];
  const category = POSITIONS_CATALOGUE.find((c) =>
    c.items.some((i) => i.id === item.id),
  );
  const progress = ((index + 1) / total) * 100;

  return (
    <main className="flex flex-1 flex-col px-5 py-6 max-w-md mx-auto w-full gap-6">
      {/* Progress + back */}
      <header className="flex items-center gap-3">
        <button
          onClick={back}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: category?.color ?? "var(--accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            <span>{category?.label}</span>
            <span>
              {index + 1} / {total}
            </span>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 flex flex-col items-center justify-center gap-7 text-center"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Wie stehst du dazu?
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight max-w-md">
            {item.text}
          </h2>

          <div className="flex flex-col gap-2.5 w-full max-w-sm mt-2">
            <StanceButton
              tone="success"
              label="Ja, finde ich gut"
              icon={<Check className="size-5" />}
              onClick={() => pick("ja")}
            />
            <StanceButton
              tone="neutral"
              label="Neutral / weiß nicht"
              icon={<Minus className="size-5" />}
              onClick={() => pick("neutral")}
            />
            <StanceButton
              tone="destructive"
              label="Nein, lehne ich ab"
              icon={<X className="size-5" />}
              onClick={() => pick("nein")}
            />
          </div>

          {stances[item.id] && (
            <p className="text-xs text-muted-foreground">
              Du hast diese Aussage schon beantwortet — kannst du jederzeit
              ändern.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="text-center text-xs text-muted-foreground">
        <Link href="/profil" className="underline underline-offset-4 hover:text-foreground">
          Werte-Check später beenden
        </Link>
      </footer>
    </main>
  );
}

function StanceButton({
  tone,
  label,
  icon,
  onClick,
}: {
  tone: "success" | "neutral" | "destructive";
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const styles =
    tone === "success"
      ? "border-success/40 hover:bg-success/10 text-success"
      : tone === "destructive"
        ? "border-chart-4/40 hover:bg-chart-4/10 text-chart-4"
        : "border-border hover:bg-muted text-foreground";
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`w-full justify-start gap-3 h-14 text-base font-medium ${styles}`}
    >
      <span
        className={`inline-flex items-center justify-center size-8 rounded-full ${
          tone === "success"
            ? "bg-success/15"
            : tone === "destructive"
              ? "bg-chart-4/15"
              : "bg-muted"
        }`}
      >
        {icon}
      </span>
      {label}
    </Button>
  );
}
