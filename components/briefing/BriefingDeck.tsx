"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { ChoiceId, Dossier, DossierChoice } from "@/lib/supabase/types";
import { useDecision } from "@/lib/briefing/useDecision";
import { buttonVariants } from "@/components/ui/button";
import {
  Newspaper,
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Frown,
  ExternalLink,
} from "lucide-react";

// Swipe-Deck statt langem Scroll-Artikel: man blättert (rechts→links wischen
// ODER "Weiter" tippen) in 3–5 Schritten durch, statt zu scrollen. Der VOLLE
// Artikel-Text bleibt erhalten — nur auf Schritte verteilt, nichts gekürzt.
// Reihenfolge: Lage → Hintergrund → (Bild) → (Short) → Zahlen → Entscheidung → Folge.
// Bild/Short erscheinen nur, wenn die Redaktion sie liefert. Die Entscheidung
// ist gegated (man muss A/B wählen, um zur Folge zu kommen). Partei-Auswahl und
// politischer Kompass sind hier RAUS — die leben im Spektrum-Tab.

type StepKind =
  | "lage"
  | "hintergrund"
  | "image"
  | "short"
  | "facts"
  | "decision"
  | "outcome";

function bodyParagraphs(body: Dossier["body"]): string[] {
  return Array.isArray(body)
    ? body.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
}

export function BriefingDeck({ dossier }: { dossier: Dossier }) {
  const { chosen, consequence, choose, submitting } = useDecision(dossier);

  const body = useMemo(() => bodyParagraphs(dossier.body), [dossier]);
  const glossar = useMemo(() => Object.entries(dossier.glossar ?? {}), [dossier]);

  // Welche Karten gibt es heute? Hintergrund nur, wenn es mehr als den ersten
  // Absatz oder ein Glossar gibt; Bild/Short nur bei vorhandener URL.
  const preSteps = useMemo<StepKind[]>(() => {
    const s: StepKind[] = ["lage"];
    if (body.length > 1 || glossar.length > 0) s.push("hintergrund");
    if (dossier.image?.url) s.push("image");
    if (dossier.video?.url) s.push("short");
    if (dossier.facts.length > 0) s.push("facts");
    s.push("decision");
    return s;
  }, [dossier, body, glossar]);

  // Outcome wird erst nach der Wahl Teil des Decks.
  const steps: StepKind[] = chosen ? [...preSteps, "outcome"] : preSteps;
  const totalDots = preSteps.length + 1; // Outcome immer mitzählen → stabile Anzahl

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const current = steps[Math.min(index, steps.length - 1)];

  const atFirst = index === 0;
  // Vor der Entscheidung frei vor/zurück; auf der Entscheidung nur per Wahl weiter.
  const canNext = current !== "decision" && index < steps.length - 1;

  function paginate(next: number) {
    const target = index + next;
    if (target < 0 || target > steps.length - 1) return;
    if (next > 0 && current === "decision") return; // Gate
    setDir(next);
    setIndex(target);
  }

  function onChoose(id: ChoiceId) {
    if (submitting || chosen) return;
    choose(id);
    // Direkt zur Folge wischen (Outcome ist jetzt im Deck).
    setDir(1);
    setIndex(preSteps.length);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const dx = info.offset.x;
    const power = Math.abs(dx) + info.velocity.x * 0.2;
    if (power < 80) return;
    if (dx < 0 && canNext) paginate(1);
    else if (dx > 0 && !atFirst) paginate(-1);
  }

  return (
    <main className="flex flex-1 flex-col w-full max-w-2xl mx-auto px-5 pb-8 pt-4">
      {/* Fortschritt */}
      <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden>
        {Array.from({ length: totalDots }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? "w-6 bg-foreground"
                : i < index
                  ? "w-1.5 bg-foreground/60"
                  : "w-1.5 bg-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Kartenbühne */}
      <div className="relative flex-1 min-h-[60vh]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            initial={{ opacity: 0, x: dir > 0 ? 64 : -64 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? -64 : 64 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragSnapToOrigin
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className="absolute inset-0 flex flex-col touch-pan-y"
          >
            {current === "lage" && <LageCard dossier={dossier} lede={body[0] ?? null} />}
            {current === "hintergrund" && (
              <HintergrundCard paragraphs={body.slice(1)} glossar={glossar} />
            )}
            {current === "image" && dossier.image?.url && (
              <ImageCard image={dossier.image} />
            )}
            {current === "short" && dossier.video?.url && (
              <ShortCard video={dossier.video} />
            )}
            {current === "facts" && <FactsCard facts={dossier.facts} />}
            {current === "decision" && (
              <DecisionCard
                dossier={dossier}
                chosen={chosen}
                submitting={submitting}
                onChoose={onChoose}
              />
            )}
            {current === "outcome" && chosen && consequence && (
              <OutcomeCard
                choice={chosen}
                consequence={consequence}
                sources={dossier.sources}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Steuerung */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={() => paginate(-1)}
          disabled={atFirst}
          aria-label="Zurück"
          className="inline-flex items-center justify-center size-11 rounded-full glass-card text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-foreground/5 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>

        {current === "decision" ? (
          <span className="text-xs text-muted-foreground">Wähle, um fortzufahren</span>
        ) : current === "outcome" ? (
          <Link
            href="/home"
            className={buttonVariants({ size: "lg" }) + " h-11 group flex-1 max-w-[16rem]"}
          >
            Weiter zum Pfad
            <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => paginate(1)}
            disabled={!canNext}
            className={buttonVariants({ size: "lg" }) + " h-11 group flex-1 max-w-[16rem]"}
          >
            Weiter
            <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        <span className="size-11 shrink-0" aria-hidden />
      </div>
    </main>
  );
}

/* ---------------- Karten ---------------- */

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col gap-4 h-full overflow-y-auto">
      {children}
    </div>
  );
}

function LageCard({ dossier, lede }: { dossier: Dossier; lede: string | null }) {
  return (
    <CardShell>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        <Newspaper className="size-3.5" />
        {dossier.kicker ?? "Tagesbriefing"}
      </span>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground">
        {dossier.headline}
      </h1>
      {dossier.deck && (
        <p className="text-lg text-foreground/85 leading-relaxed">{dossier.deck}</p>
      )}
      {lede && (
        <p className="text-[15px] text-foreground/75 leading-relaxed">{lede}</p>
      )}
    </CardShell>
  );
}

// Hintergrund-Karte: der restliche Artikel-Text (volle Absätze, nichts gekürzt)
// plus "Kurz erklärt"-Glossar — der Lese-Mehrwert pro Tag.
function HintergrundCard({
  paragraphs,
  glossar,
}: {
  paragraphs: string[];
  glossar: [string, string][];
}) {
  return (
    <CardShell>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Hintergrund
      </span>
      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-3 text-[15px] text-foreground/85 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {glossar.length > 0 && (
        <div className="flex flex-col gap-2 mt-1 rounded-2xl border border-foreground/10 p-4">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Kurz erklärt
          </h3>
          <dl className="flex flex-col gap-2.5">
            {glossar.map(([term, def]) => (
              <div key={term} className="flex flex-col gap-0.5">
                <dt className="font-semibold text-sm">{term}</dt>
                <dd className="text-sm text-foreground/75 leading-snug">{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </CardShell>
  );
}

function ImageCard({ image }: { image: NonNullable<Dossier["image"]> }) {
  return (
    <CardShell>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Zum Thema
      </span>
      <figure className="flex flex-col gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt ?? image.caption ?? "Bild zum Thema"}
          className="w-full rounded-2xl border border-foreground/10 object-cover max-h-[52vh]"
        />
        {(image.caption || image.source) && (
          <figcaption className="text-xs text-muted-foreground leading-snug">
            {image.caption}
            {image.source && (
              <span className="text-foreground/45"> · {image.source}</span>
            )}
          </figcaption>
        )}
      </figure>
    </CardShell>
  );
}

function ShortCard({ video }: { video: NonNullable<Dossier["video"]> }) {
  return (
    <CardShell>
      <span className="inline-flex w-fit items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-[0.18em]">
        <PlayCircle className="size-3.5" />
        Short ansehen
      </span>
      {video.title && (
        <h2 className="font-serif text-xl font-semibold leading-snug">{video.title}</h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-black aspect-video">
        <iframe
          src={video.url ?? undefined}
          title={video.title || "Short zum Thema"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {video.blurb && (
        <p className="text-sm text-foreground/70 leading-relaxed">{video.blurb}</p>
      )}
      {video.channel && (
        <span className="text-xs text-muted-foreground">{video.channel}</span>
      )}
    </CardShell>
  );
}

function FactsCard({ facts }: { facts: Dossier["facts"] }) {
  return (
    <CardShell>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Drei Zahlen, die alles erklären
      </span>
      <ul className="flex flex-col gap-3">
        {facts.slice(0, 3).map((fact, i) => (
          <li key={`${fact.label}-${i}`} className="flex items-baseline gap-4">
            <span className="font-serif text-3xl font-semibold leading-none tabular-nums whitespace-nowrap text-foreground">
              {fact.value}
            </span>
            <span className="text-sm text-foreground/75 leading-snug">{fact.label}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function DecisionCard({
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
    <CardShell>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Du sitzt am Tisch
      </span>
      <h2 className="font-serif text-2xl font-semibold leading-snug">
        {dossier.streitfrage ?? "Wofür entscheidest du dich?"}
      </h2>
      <ul className="flex flex-col gap-2.5 mt-1">
        {dossier.choices.slice(0, 2).map((choice) => {
          const isChosen = chosen?.id === choice.id;
          return (
            <li key={choice.id}>
              <button
                type="button"
                disabled={submitting || !!chosen}
                onClick={() => onChoose(choice.id)}
                className={`group w-full text-left rounded-2xl p-4 flex flex-col gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                  isChosen
                    ? "bg-success/10 border border-success/40"
                    : "glass-card hover:bg-foreground/5 hover:border-foreground/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center size-8 rounded-full font-mono text-sm font-semibold ${
                      isChosen
                        ? "bg-success text-white"
                        : "bg-foreground text-background"
                    }`}
                  >
                    {isChosen ? <Check className="size-4" strokeWidth={3} /> : choice.id}
                  </span>
                  <span className="font-serif text-lg font-semibold leading-snug pt-0.5">
                    {choice.label}
                  </span>
                </div>
                <ul className="pl-11 flex flex-col gap-1 text-sm text-muted-foreground">
                  {choice.bullets.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span aria-hidden>·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>
    </CardShell>
  );
}

function OutcomeCard({
  choice,
  consequence,
  sources,
}: {
  choice: DossierChoice;
  consequence: NonNullable<Dossier["consequences"][ChoiceId]>;
  sources: Dossier["sources"];
}) {
  return (
    <CardShell>
      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
          Deine Wahl: {choice.label}
        </span>
      </div>
      <h2 className="font-serif text-xl font-semibold leading-snug">Was jetzt passiert</h2>
      <p className="text-base text-foreground/80 leading-relaxed">{consequence.summary}</p>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <ReactionTile title="Freuen sich" icon={<CheckCircle2 className="size-4" />} items={consequence.cheers} />
        <ReactionTile title="Enttäuscht" icon={<Frown className="size-4" />} items={consequence.upset} muted />
      </div>

      {sources.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-foreground/10">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Quellen
          </h3>
          <ul className="flex flex-col gap-1">
            {sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground underline underline-offset-4"
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span>{s.title}</span>
                  {s.outlet && <span className="text-foreground/45">· {s.outlet}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-center text-foreground/55 mt-1">
        Morgen wartet das nächste Dossier auf dich.
      </p>
    </CardShell>
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
    <div className="rounded-2xl border border-foreground/10 p-3 flex flex-col gap-2">
      <h3
        className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {icon}
        {title}
      </h3>
      <ul className="flex flex-col gap-0.5 text-sm text-foreground/80">
        {items.slice(0, 3).map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
