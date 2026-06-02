"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleQuestion, Check, Users } from "lucide-react";
import type { Dossier, DossierMeinungOption } from "@/lib/supabase/types";
import { ensureLocalSession } from "@/lib/local/session";
import { markBriefingDoneLocally } from "@/lib/local/streak";

type Tally = {
  total: number;
  options: { option_id: string; votes: number }[];
  my_choice: string | null;
};

// "Was meinst du?" — der Nutzer stimmt zu einer Meinungsfrage ab und sieht
// danach, wie die Community steht (echte Stimmen), die Begründung jeder Seite
// und eine neutrale Einordnung. Wird im BriefingDeck als eigene Karte gezeigt;
// `onComplete` meldet dem Deck, dass der Tag erledigt ist (Footer schaltet die
// "Weiter zum Pfad"-Aktion frei).
export function MeinungSection({
  dossier,
  onComplete,
}: {
  dossier: Dossier;
  onComplete?: () => void;
}) {
  const meinung = dossier.meinung!;
  const date = dossier.publish_date;
  const [voterId, setVoterId] = useState<string | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [pending, setPending] = useState(false);

  // Beim Laden: voter-id sichern + ggf. schon abgegebene Stimme holen.
  useEffect(() => {
    const id = ensureLocalSession().userId;
    setVoterId(id);
    fetch(`/api/meinung?date=${encodeURIComponent(date)}&voter=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((t: Tally | null) => {
        if (t) {
          setTally(t);
          if (t.my_choice) onComplete?.();
        }
      })
      .catch(() => {});
    // onComplete bewusst nicht in den Deps — stabiler Callback aus dem Deck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const myChoice = tally?.my_choice ?? null;
  const voted = !!myChoice;

  async function vote(optionId: string) {
    if (voted || pending || !voterId) return;
    setPending(true);
    // Optimistisch: Tag als gespielt markieren (Streak), Wahl sofort zeigen.
    markBriefingDoneLocally();
    setTally((prev) => ({ ...(prev ?? { total: 0, options: [] }), my_choice: optionId } as Tally));
    onComplete?.();
    try {
      const res = await fetch("/api/meinung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, option: optionId, voter: voterId }),
      });
      if (res.ok) setTally((await res.json()) as Tally);
    } catch {
      // lokal ist die Wahl schon gesetzt; Ergebnis kommt beim nächsten Laden.
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          <MessageCircleQuestion className="size-3.5" />
          Was meinst du?
        </span>
        <h2 className="font-serif text-2xl font-semibold leading-snug">
          {meinung.frage}
        </h2>
      </header>

      {!voted ? (
        <ul className="flex flex-col gap-2.5">
          {meinung.optionen.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => vote(opt.id)}
                className="glass-card group w-full text-left rounded-2xl p-5 flex flex-col gap-1.5 hover:bg-foreground/5 hover:border-foreground/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <span className="font-serif text-lg font-semibold leading-snug">
                  {opt.label}
                </span>
                <span className="text-sm text-muted-foreground leading-snug">
                  {opt.begruendung}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <MeinungResult meinung={meinung} tally={tally} myChoice={myChoice} />
      )}
    </section>
  );
}

function MeinungResult({
  meinung,
  tally,
  myChoice,
}: {
  meinung: NonNullable<Dossier["meinung"]>;
  tally: Tally | null;
  myChoice: string | null;
}) {
  const total = tally?.total ?? 0;
  const votesFor = (id: string) =>
    tally?.options.find((o) => o.option_id === id)?.votes ?? 0;
  const pct = (id: string) => (total > 0 ? Math.round((votesFor(id) / total) * 100) : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {meinung.optionen.map((opt: DossierMeinungOption) => {
          const mine = opt.id === myChoice;
          const percent = pct(opt.id);
          return (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-2xl border p-4 ${
                mine ? "border-primary/50 bg-primary/[0.04]" : "border-foreground/10 glass-card"
              }`}
            >
              <motion.div
                aria-hidden
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 ${mine ? "bg-primary/15" : "bg-foreground/[0.06]"}`}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold leading-snug flex items-center gap-1.5">
                    {mine && <Check className="size-4 text-primary shrink-0" strokeWidth={3} />}
                    {opt.label}
                  </span>
                  <span className="text-sm text-foreground/70 leading-snug">
                    {opt.begruendung}
                  </span>
                </div>
                <span className="font-mono text-lg font-semibold tabular-nums shrink-0">
                  {percent}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        {total === 0
          ? "Noch keine Stimmen — du bist die erste."
          : total === 1
            ? "1 Stimme bisher · du bist die erste."
            : `${total} Stimmen bisher`}
      </div>

      <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Warum die Meinungen auseinandergehen
        </span>
        <p className="text-[15px] leading-relaxed text-foreground/85">
          {meinung.einordnung}
        </p>
      </div>
    </div>
  );
}
