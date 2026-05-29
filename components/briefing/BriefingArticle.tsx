"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type {
  ChoiceId,
  Dossier,
  DossierChoice,
  DossierFormat,
} from "@/lib/supabase/types";
import { resolveFormat } from "@/lib/dossier/format";
import { useDecision } from "@/lib/briefing/useDecision";
import { partyProximity } from "@/lib/spektrum/compute";
import { CompassMap } from "@/components/spektrum/CompassMap";
import { PartyMatches } from "@/components/spektrum/PartyMatches";
import { Button } from "@/components/ui/button";
import {
  Newspaper,
  ArrowRight,
  Clock,
  CheckCircle2,
  Frown,
  TrendingUp,
  TrendingDown,
  Send,
  Phone,
  Handshake,
  Megaphone,
  ExternalLink,
} from "lucide-react";

// One scrollable daily article. Reads like a magazine piece, then drops you
// into an interactive decision whose follow-up depends on the day's `format`
// (decision | reporter-chat | koalition | plakat). All four reuse the same
// dossier data and the shared useDecision() hook — modular by design so new
// formats (and the larger simulator) can plug in without a rewrite.

const FORMAT_LABEL: Record<DossierFormat, string> = {
  decision: "Tages-Entscheidung",
  "reporter-chat": "Reporter-Interview",
  koalition: "Koalitions-Verhandlung",
  plakat: "Wahlkampf-Plakat",
};

function bodyParagraphs(body: Dossier["body"]): string[] {
  return Array.isArray(body)
    ? body.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
}

function readingMinutes(d: Dossier): number {
  const parts = [
    d.deck ?? "",
    ...bodyParagraphs(d.body),
    ...d.facts.map((f) => `${f.value} ${f.label}`),
    ...d.choices.flatMap((c) => [c.label, ...c.bullets]),
  ];
  const words = parts.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(6, Math.round(words / 180) || 3));
}

export function BriefingArticle({ dossier }: { dossier: Dossier }) {
  const format = resolveFormat(dossier);
  const {
    chosen,
    consequence,
    spektrumBefore,
    spektrumAfter,
    submitting,
    choose,
  } = useDecision(dossier);

  // reporter-chat / koalition / plakat add one beat before the outcome.
  const hasChat = format === "reporter-chat" && !!chosen?.press_question;
  const needsFollowUp =
    (hasChat || format === "koalition" || format === "plakat") &&
    !!chosen;
  const [followUpDone, setFollowUpDone] = useState(false);
  const showOutcome = !!chosen && consequence && (!needsFollowUp || followUpDone);

  const decisionRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  // Smooth-scroll the new section into view as the article unfolds.
  useEffect(() => {
    if (!chosen) return;
    const target = showOutcome ? outcomeRef.current : followUpRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [chosen, showOutcome]);

  const minutes = readingMinutes(dossier);
  const body = bodyParagraphs(dossier.body);
  const glossar = Object.entries(dossier.glossar ?? {});

  return (
    <main className="flex-1 w-full">
      <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8 sm:pt-12 flex flex-col gap-8">
        {/* Magazine header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Newspaper className="size-3.5" />
              {dossier.kicker ?? "Tagesbriefing"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 text-foreground/70 px-3 py-1 text-xs font-medium">
              {FORMAT_LABEL[format]}
            </span>
            <span className="inline-flex items-center gap-1 text-foreground/55 text-xs font-medium">
              <Clock className="size-3.5" />
              {minutes} Min.
            </span>
          </div>

          <h1 className="text-on-bg font-serif text-3xl sm:text-4xl font-semibold leading-[1.1] text-foreground">
            {dossier.headline}
          </h1>

          {dossier.deck && (
            <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed">
              {dossier.deck}
            </p>
          )}
        </header>

        {/* Video slot — prepared, hidden until a clip exists. */}
        {dossier.video?.url && (
          <figure className="overflow-hidden rounded-2xl border border-border bg-black/5 aspect-video">
            <iframe
              src={dossier.video.url}
              title={dossier.video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </figure>
        )}

        {/* Optional long-form body paragraphs */}
        {body.length > 0 && (
          <div className="flex flex-col gap-4 text-[17px] leading-relaxed text-foreground/90">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Facts */}
        {dossier.facts.length > 0 && <FactsSection facts={dossier.facts} />}

        {/* Glossar */}
        {glossar.length > 0 && (
          <section className="glass-card rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
              Kurz erklärt
            </h2>
            <dl className="flex flex-col gap-3">
              {glossar.map(([term, def]) => (
                <div key={term} className="flex flex-col gap-0.5">
                  <dt className="font-semibold text-sm">{term}</dt>
                  <dd className="text-sm text-foreground/75 leading-snug">{def}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Decision */}
        <div ref={decisionRef} className="scroll-mt-20">
          <DecisionSection
            dossier={dossier}
            chosen={chosen}
            submitting={submitting}
            onChoose={(id) => choose(id)}
          />
        </div>

        {/* Format-specific follow-up beat */}
        {needsFollowUp && !followUpDone && chosen && (
          <div ref={followUpRef} className="scroll-mt-20">
            {hasChat && (
              <ReporterChatSection
                dossier={dossier}
                choice={chosen}
                onDone={() => setFollowUpDone(true)}
              />
            )}
            {!hasChat && format === "koalition" && consequence && (
              <KoalitionSection
                partners={consequence.cheers}
                onDone={() => setFollowUpDone(true)}
              />
            )}
            {!hasChat && format === "plakat" && (
              <PlakatSection choice={chosen} onDone={() => setFollowUpDone(true)} />
            )}
          </div>
        )}

        {/* Outcome */}
        {showOutcome && chosen && consequence && (
          <div ref={outcomeRef} className="scroll-mt-20">
            <OutcomeSection
              choice={chosen}
              consequence={consequence}
              spektrumBefore={spektrumBefore}
              spektrumAfter={spektrumAfter}
            />
          </div>
        )}

        {/* Sources */}
        {dossier.sources.length > 0 && (
          <footer className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
              Quellen
            </h2>
            <ul className="flex flex-col gap-1.5">
              {dossier.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span>{s.title}</span>
                    {s.outlet && (
                      <span className="text-foreground/45">· {s.outlet}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </article>
    </main>
  );
}

/* ---------- sections ---------- */

function FactsSection({ facts }: { facts: Dossier["facts"] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Drei Zahlen, die alles erklären
      </h2>
      <ul className="grid gap-3">
        {facts.map((fact, index) => (
          <li
            key={`${fact.label}-${index}`}
            className="glass-card rounded-2xl p-5 flex items-baseline gap-4"
          >
            <span className="font-serif text-3xl sm:text-4xl font-semibold leading-none tabular-nums whitespace-nowrap text-foreground">
              {fact.value}
            </span>
            <span className="text-sm sm:text-base text-foreground/75 leading-snug">
              {fact.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DecisionSection({
  dossier,
  chosen,
  submitting,
  onChoose,
}: {
  dossier: Dossier;
  chosen: DossierChoice | null;
  submitting: boolean;
  onChoose: (id: ChoiceId) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Du sitzt am Tisch
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {dossier.streitfrage ?? "Wofür entscheidest du dich?"}
        </h2>
      </header>

      {!chosen ? (
        <ul className="flex flex-col gap-2.5">
          {dossier.choices.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onChoose(choice.id)}
                className="glass-card group w-full text-left rounded-2xl p-5 flex flex-col gap-3 hover:bg-foreground/5 hover:border-foreground/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-foreground text-background font-mono text-sm font-semibold">
                    {choice.id}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-semibold leading-snug pt-1">
                    {choice.label}
                  </span>
                </div>
                <ul className="pl-12 flex flex-col gap-1 text-sm text-muted-foreground">
                  {choice.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span aria-hidden>·</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground font-mono text-sm font-semibold">
            {chosen.id}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deine Wahl
            </span>
            <span className="font-serif text-lg font-semibold leading-snug">
              {chosen.label}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

// Reporter interview — inline iMessage-style beat. Uses --primary (no hardcoded
// hex), so it stays on-brand in light + dark.
function ReporterChatSection({
  dossier,
  choice,
  onDone,
}: {
  dossier: Dossier;
  choice: DossierChoice;
  onDone: () => void;
}) {
  const press = dossier.press;
  const presets = choice.press_presets ?? [];
  const question = choice.press_question ?? "Was sagen Sie dazu?";
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSent(true);
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1.5">
        <span className="text-on-bg inline-flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-[0.18em]">
          <Phone className="size-3.5" />
          Eingehender Anruf
        </span>
        <h2 className="text-on-bg font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {press ? `${press.name} ruft an.` : "Die Presse fragt nach."}
        </h2>
      </header>

      {press && (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
          <span
            className={`inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br ${press.gradient_from} ${press.gradient_to} text-white font-semibold shadow-sm`}
            aria-hidden
          >
            {press.initials}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold leading-tight">{press.name}</span>
            <span className="text-xs text-foreground/65">
              {press.role} · {press.outlet}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="self-start max-w-[85%] rounded-2xl rounded-bl-md bg-card text-card-foreground border border-foreground/10 px-4 py-3 text-[15px] leading-relaxed shadow-sm"
        >
          {question}
        </motion.div>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 text-[15px] leading-relaxed shadow-sm"
          >
            {reply}
          </motion.div>
        )}
      </div>

      {!sent ? (
        <>
          {presets.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {presets.map((preset, i) => (
                <li key={i} className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReply(preset)}
                    className={`max-w-[90%] text-right rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      reply === preset
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "glass-card hover:bg-foreground/[0.03] text-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Antwort schreiben …"
              className="flex-1 h-11 rounded-full bg-card border border-foreground/15 px-4 text-[15px] placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 shadow-sm"
            />
            <button
              type="submit"
              disabled={!reply.trim()}
              aria-label="Antwort senden"
              className="inline-flex items-center justify-center size-11 rounded-full bg-primary text-primary-foreground shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Send className="size-4" fill="currentColor" />
            </button>
          </form>
        </>
      ) : (
        <Button
          onClick={onDone}
          size="lg"
          className="h-12 group bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Folgen ansehen
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      )}
    </section>
  );
}

// Coalition beat — pick a partner from the groups that cheer your choice.
function KoalitionSection({
  partners,
  onDone,
}: {
  partners: string[];
  onDone: () => void;
}) {
  const options = partners.slice(0, 3);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          <Handshake className="size-3.5" />
          Koalition bilden
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          Mit wem regierst du?
        </h2>
      </header>

      {options.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {options.map((partner) => (
            <li key={partner}>
              <button
                type="button"
                onClick={() => setPicked(partner)}
                className={`w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  picked === partner
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "glass-card hover:bg-foreground/5"
                }`}
              >
                <Handshake className="size-5 shrink-0" />
                <span className="font-semibold">{partner}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/70">
          Keine offensichtlichen Partner — du regierst als Minderheit.
        </p>
      )}

      <Button
        onClick={onDone}
        disabled={options.length > 0 && !picked}
        size="lg"
        className="h-12 group"
      >
        {picked ? `Mit ${picked} regieren` : "Weiter"}
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </section>
  );
}

// Campaign-poster beat — turn the chosen stance into a slogan + accent.
const PLAKAT_ACCENTS: { id: string; label: string; cls: string }[] = [
  { id: "sky", label: "Blau", cls: "bg-pastel-sky text-pastel-sky-ink" },
  { id: "sand", label: "Gold", cls: "bg-pastel-sand text-pastel-sand-ink" },
  { id: "rose", label: "Rot", cls: "bg-pastel-rose text-pastel-rose-ink" },
];

function PlakatSection({
  choice,
  onDone,
}: {
  choice: DossierChoice;
  onDone: () => void;
}) {
  const slogans = choice.bullets.length > 0 ? choice.bullets : [choice.label];
  const [slogan, setSlogan] = useState(slogans[0]);
  const [accent, setAccent] = useState(PLAKAT_ACCENTS[0]);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          <Megaphone className="size-3.5" />
          Mach daraus eine Kampagne
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          Dein Plakat zum Thema
        </h2>
      </header>

      {/* Live preview */}
      <div
        className={`rounded-2xl ${accent.cls} aspect-[3/4] max-w-xs w-full mx-auto p-6 flex flex-col justify-between shadow-md`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
          {choice.label}
        </span>
        <p className="font-serif text-2xl font-semibold leading-tight">{slogan}</p>
        <span className="text-xs font-medium opacity-70">Politpuls · Wahlkampf</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Slogan
        </span>
        <ul className="flex flex-col gap-1.5">
          {slogans.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setSlogan(s)}
                className={`w-full text-left rounded-xl px-4 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  slogan === s
                    ? "bg-primary text-primary-foreground"
                    : "glass-card hover:bg-foreground/5"
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2">
        {PLAKAT_ACCENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-label={a.label}
            onClick={() => setAccent(a)}
            className={`size-8 rounded-full ${a.cls} ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              accent.id === a.id ? "ring-2 ring-ring" : ""
            }`}
          />
        ))}
      </div>

      <Button onClick={onDone} size="lg" className="h-12 group">
        Plakat steht — Folgen ansehen
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </section>
  );
}

function OutcomeSection({
  choice,
  consequence,
  spektrumBefore,
  spektrumAfter,
}: {
  choice: DossierChoice;
  consequence: NonNullable<Dossier["consequences"][ChoiceId]>;
  spektrumBefore: { economic: number; social: number };
  spektrumAfter: { economic: number; social: number };
}) {
  const matches = partyProximity(spektrumAfter);
  const deltas = choice.deltas ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Was jetzt passiert
        </span>
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
          {consequence.summary}
        </p>
      </div>

      {deltas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground px-1">
            Konkrete Auswirkungen
          </h3>
          <ul className="flex flex-col gap-2">
            {deltas.map((d, i) => (
              <li
                key={i}
                className="glass-card flex items-center gap-3 rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-medium leading-tight">{d.label}</span>
                  {d.note && (
                    <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {d.note}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold tabular-nums border border-foreground/15 ${
                    d.good ? "bg-success/10 text-success" : "bg-foreground/5 text-foreground/60"
                  }`}
                >
                  {d.good ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {d.delta > 0 ? "+" : ""}
                  {d.delta}
                  {d.unit ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReactionTile
          title="Freuen sich"
          icon={<CheckCircle2 className="size-4" />}
          items={consequence.cheers}
        />
        <ReactionTile
          title="Sind enttäuscht"
          icon={<Frown className="size-4" />}
          items={consequence.upset}
          muted
        />
      </div>

      <section className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Dein politischer Kompass
          </span>
          <h3 className="font-serif text-xl font-semibold leading-snug">
            So hat sich dein Standpunkt verschoben.
          </h3>
        </header>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <CompassMap user={spektrumAfter} previous={spektrumBefore} />
          <div className="w-full sm:flex-1 flex flex-col gap-3">
            <h4 className="text-sm font-medium">Deine drei nächsten Parteien</h4>
            <PartyMatches matches={matches} />
          </div>
        </div>
      </section>

      <Link
        href="/home"
        className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold group hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Weiter zum Pfad
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      <p className="text-on-bg text-xs text-center text-foreground/65">
        Morgen wartet das nächste Dossier auf dich.
      </p>
    </section>
  );
}

function ReactionTile({
  title,
  icon,
  items,
  muted,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <h3
        className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-foreground/80">
        {items.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
