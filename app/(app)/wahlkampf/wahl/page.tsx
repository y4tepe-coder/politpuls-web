"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  computeElectionResult,
  possibleCoalitions,
  determineRole,
  type Coalition,
  type ElectionResult,
} from "@/lib/spektrum/election";
import { TV_TRIELL_FRAGEN } from "@/lib/data/tv-triell";
import { getLocalState, updateLocalState } from "@/lib/local/state";
import type { PartyId } from "@/lib/spektrum/types";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Briefcase,
  Megaphone,
  Trophy,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// /wahlkampf/wahl: Hochrechnung + Result-Reveal + Koalitions-Picker.
// Score wird aus campaign_triell_answers + campaign_themen.length + campaign_plakat berechnet.

type Phase = "intro" | "results" | "coalition" | "role";

export default function WahlPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [hydrated, setHydrated] = useState(false);
  const [results, setResults] = useState<ElectionResult[] | null>(null);
  const [coalitions, setCoalitions] = useState<Coalition[]>([]);
  const [picked, setPicked] = useState<Coalition | null>(null);
  const [myPartyId, setMyPartyId] = useState<PartyId | null>(null);

  useEffect(() => {
    const local = getLocalState();
    const partyId = (local.party_id as PartyId | null) ?? null;
    setMyPartyId(partyId);

    // Score: Triell (sum popularity) + Programm-Themen (3 = max +6) + Plakat (vorhanden = +4)
    const triellScore = TV_TRIELL_FRAGEN.reduce((sum, f) => {
      const aId = local.campaign_triell_answers?.[f.id];
      const a = f.answers.find((x) => x.id === aId);
      return sum + (a?.popularity ?? 0);
    }, 0);
    const programmScore = (local.campaign_themen?.length ?? 0) * 2;
    const plakatScore = local.campaign_plakat ? 4 : 0;
    const score = triellScore + programmScore + plakatScore;

    // Seed stable per cycle: party_id + current_week
    const weekId = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    const seed = `${partyId ?? "none"}-${weekId}`;

    const r = computeElectionResult(partyId, score, seed);
    setResults(r);
    setCoalitions(possibleCoalitions(r));
    setHydrated(true);
  }, []);

  function finish(coalition: Coalition | null) {
    if (!results) return;
    const role = determineRole(results, coalition, myPartyId);
    updateLocalState({ role });
    // Best-effort: Rolle + Partei geräteübergreifend sichern. Schaltet u.a.
    // das "Auswirkung auf Deutschland"-Modul im Spektrum frei.
    void fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, party_id: myPartyId }),
    }).catch(() => null);
    setPicked(coalition);
    setPhase("role");
  }

  if (!hydrated || !results) return <div className="flex-1" />;

  // Intro screen
  if (phase === "intro") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center text-center max-w-md mx-auto w-full px-5 py-6 gap-7">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center size-20 rounded-full bg-foreground/5"
        >
          <Trophy className="size-10 text-foreground" />
        </motion.div>
        <header className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Wahlsonntag
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            18:00 Uhr — die Hochrechnung.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Alle Stimmen sind ausgezählt. Bereit für dein Ergebnis?
          </p>
        </header>
        <Button
          onClick={() => setPhase("results")}
          size="lg"
          className="h-12 px-8 group w-full max-w-sm"
        >
          Ergebnis enthüllen
          <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </main>
    );
  }

  // Results screen
  if (phase === "results") {
    const mine = results.find((r) => r.mine);
    return (
      <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
        <header className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Hochrechnung 18:00
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            {mine
              ? `${mine.party.shortName}: ${mine.percent.toFixed(1)} %`
              : "Wahlergebnis"}
          </h1>
        </header>

        <ul className="flex flex-col gap-2.5">
          {results.map((r, i) => (
            <motion.li
              key={r.partyId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                r.mine
                  ? "border-foreground bg-card shadow-md"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-xs font-mono tabular-nums text-muted-foreground w-5 text-center">
                {i + 1}
              </span>
              <span
                className="size-3.5 rounded-full shrink-0"
                style={{ backgroundColor: r.party.color }}
                aria-hidden
              />
              <span className="flex-1 font-serif font-semibold text-base">
                {r.party.shortName}
                {r.mine && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-foreground text-background px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                    Du
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 w-28">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: r.party.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.percent}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-mono tabular-nums text-muted-foreground w-10 text-right">
                  {r.percent.toFixed(1)}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>

        <Button
          onClick={() => {
            // Direkt zu Rolle wenn Kanzler, sonst zu Koalition
            if (results[0]?.partyId === myPartyId) {
              finish(null);
            } else {
              setPhase("coalition");
            }
          }}
          size="lg"
          className="h-12 mt-4 group"
        >
          {results[0]?.partyId === myPartyId
            ? "Regierung bilden"
            : "Koalitions-Verhandlungen"}
          <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </main>
    );
  }

  // Coalition picker
  if (phase === "coalition") {
    const coalitionsWithMine = coalitions.filter((c) =>
      myPartyId ? c.partyIds.includes(myPartyId) : false,
    );
    const allCoalitions = coalitionsWithMine.length > 0 ? coalitionsWithMine : coalitions;
    return (
      <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-5">
        <header className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Koalition
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
            Welche Koalition bildet die Regierung?
          </h1>
          <p className="text-sm text-muted-foreground">
            {coalitionsWithMine.length > 0
              ? "Koalitionen, in denen deine Partei mitregiert."
              : "Möglich auch ohne dich — du wärst dann Opposition."}
          </p>
        </header>

        <ul className="flex flex-col gap-2.5">
          {allCoalitions.map((c) => (
            <li key={c.partyIds.join("-")}>
              <button
                type="button"
                onClick={() => finish(c)}
                className="glass-card group w-full text-left rounded-2xl text-foreground p-4 hover:bg-foreground/5 transition-all flex items-center gap-3"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-serif font-semibold text-lg leading-tight">
                    {c.label}
                  </span>
                  <span className="text-xs opacity-80">
                    {c.partyIds.length} Parteien · {c.sumPercent.toFixed(1)} %
                  </span>
                </div>
                <div className="flex -space-x-1.5">
                  {c.partyIds.map((pid) => {
                    const p = results.find((r) => r.partyId === pid)?.party;
                    return (
                      <span
                        key={pid}
                        className="size-7 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: p?.color ?? "#888" }}
                        aria-hidden
                      />
                    );
                  })}
                </div>
                <ArrowRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => finish(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 py-3"
            >
              Keine Koalition möglich — in die Opposition
            </button>
          </li>
        </ul>
      </main>
    );
  }

  // Role reveal
  const role = determineRole(results, picked, myPartyId);
  const roleData = {
    kanzler: {
      title: "Bundeskanzler",
      icon: <Crown className="size-10" />,
      blurb:
        "Deine Partei hat die Wahl gewonnen. Du übernimmst die Regierung — Außenpolitik, Haushalt, Krisen-Management liegen jetzt in deiner Hand.",
      tone: "glass-card text-foreground",
    },
    minister: {
      title: "Minister",
      icon: <Briefcase className="size-10" />,
      blurb: picked
        ? `Du regierst in der ${picked.label}-Koalition mit. Welches Ressort? Das verhandelst du noch.`
        : "Du regierst in der Koalition mit. Welches Ressort? Das verhandelst du noch.",
      tone: "glass-card text-foreground",
    },
    opposition: {
      title: "Opposition",
      icon: <Megaphone className="size-10" />,
      blurb:
        "Es hat nicht gereicht. Du wirst zur lautesten Stimme im Bundestag — andere Mechanik, gleicher Einfluss.",
      tone: "glass-card text-foreground",
    },
  }[role];

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center max-w-md mx-auto w-full px-5 py-6 gap-7">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`inline-flex items-center justify-center size-24 rounded-full ${roleData.tone}`}
      >
        {roleData.icon}
      </motion.div>
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Deine neue Rolle
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
          {roleData.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
          {roleData.blurb}
        </p>
      </header>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <Link
          href="/profil"
          className={buttonVariants({ size: "lg" }) + " h-12 group"}
        >
          Zum Profil
          <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/heute"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 py-3"
        >
          Zurück zum täglichen Briefing
        </Link>
      </div>
    </main>
  );
}
