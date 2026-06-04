"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type {
  ChoiceId,
  Dossier,
  DossierChoice,
  DossierImage,
} from "@/lib/supabase/types";
import { useDecision } from "@/lib/briefing/useDecision";
import { resolveFormat } from "@/lib/dossier/format";
import { MeinungSection } from "@/components/briefing/MeinungSection";
import { FaktencheckSection } from "@/components/briefing/FaktencheckSection";
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
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

// Swipe-Deck statt langem Scroll-Artikel: man blättert (rechts→links wischen
// ODER "Weiter" tippen) durch wenige Schritte. Lage + Hintergrund sind zu EINER
// Lese-Karte zusammengeführt; Glossar-Begriffe sind direkt im Text antippbar
// (kein Seitenwechsel). Reihenfolge: Lesen → (Galerie) → (Short ≤3 Min) →
// Zahlen → Entscheidung → Folge. Bilder/Short erscheinen nur, wenn die Redaktion
// sie liefert. Die Entscheidung ist gegated (man muss A/B wählen).

type StepKind =
  | "lesen"
  | "image"
  | "short"
  | "facts"
  | "decision"
  | "meinung"
  | "faktencheck"
  | "outcome";

const MAX_VIDEO_SECONDS = 180; // harte 3-Minuten-Grenze für den Short

function bodyParagraphs(body: Dossier["body"]): string[] {
  return Array.isArray(body)
    ? body.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
}

// "M:SS" oder "H:MM:SS" → Sekunden. Null, wenn nicht parsebar.
function runtimeSeconds(runtime?: string | null): number | null {
  if (!runtime) return null;
  const parts = runtime.trim().split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function BriefingDeck({ dossier }: { dossier: Dossier }) {
  const { chosen, consequence, choose, submitting } = useDecision(dossier);

  const format = resolveFormat(dossier);
  const isMeinung =
    format === "meinung" && (dossier.meinung?.optionen?.length ?? 0) >= 2;
  const isFaktencheck =
    format === "faktencheck" && !!dossier.faktencheck?.behauptung;
  // Welche Interaktion ersetzt heute die Entscheidung? (Fallback: decision.)
  const interaction: StepKind = isFaktencheck
    ? "faktencheck"
    : isMeinung
      ? "meinung"
      : "decision";
  const [formatDone, setFormatDone] = useState(false);

  const body = useMemo(() => bodyParagraphs(dossier.body), [dossier]);
  const glossar = useMemo(() => Object.entries(dossier.glossar ?? {}), [dossier]);

  // Galerie: explizite images + das einzelne image, nach URL dedupliziert.
  const gallery = useMemo<DossierImage[]>(() => {
    const all = [...(dossier.images ?? []), ...(dossier.image ? [dossier.image] : [])];
    const seen = new Set<string>();
    return all.filter((img) => {
      if (!img?.url || seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });
  }, [dossier]);

  // Short nur, wenn URL da UND Länge ≤ 3 Min (oder keine Länge angegeben —
  // dann verlässt sich die UI auf die Redaktions-Regel). Ein erkennbar zu
  // langer Clip wird komplett unterdrückt.
  const videoOk = useMemo(() => {
    if (!dossier.video?.url) return false;
    const secs = runtimeSeconds(dossier.video.runtime);
    return secs === null || secs <= MAX_VIDEO_SECONDS;
  }, [dossier]);

  const preSteps = useMemo<StepKind[]>(() => {
    const s: StepKind[] = ["lesen"];
    if (gallery.length > 0) s.push("image");
    if (videoOk) s.push("short");
    if (dossier.facts.length > 0) s.push("facts");
    s.push(interaction);
    return s;
  }, [dossier, gallery, videoOk, interaction]);

  // Outcome wird erst nach der Wahl Teil des Decks.
  const steps: StepKind[] =
    interaction === "decision" && chosen ? [...preSteps, "outcome"] : preSteps;
  // Outcome nur beim Entscheidungs-Format; meinung/faktencheck sind selbst der Schluss.
  const totalDots = interaction === "decision" ? preSteps.length + 1 : preSteps.length;

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
            {current === "lesen" && (
              <LeseCard dossier={dossier} paragraphs={body} glossar={glossar} />
            )}
            {current === "image" && gallery.length > 0 && (
              <GalleryCard images={gallery} />
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
            {current === "meinung" && (
              <CardShell>
                <MeinungSection
                  dossier={dossier}
                  onComplete={() => setFormatDone(true)}
                />
              </CardShell>
            )}
            {current === "faktencheck" && (
              <CardShell>
                <FaktencheckSection
                  dossier={dossier}
                  onComplete={() => setFormatDone(true)}
                />
              </CardShell>
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
        ) : current === "meinung" || current === "faktencheck" ? (
          formatDone ? (
            <Link
              href="/home"
              className={buttonVariants({ size: "lg" }) + " h-11 group flex-1 max-w-[16rem]"}
            >
              Weiter zum Pfad
              <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              {current === "meinung"
                ? "Stimm ab, um fortzufahren"
                : "Schätz, um fortzufahren"}
            </span>
          )
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

// Eine Lese-Karte: Lage + Hintergrund zusammengeführt. Voller Artikel-Text,
// nichts gekürzt. Glossar-Begriffe sind im Fließtext antippbar (GlossarText) —
// so holt man sich Hintergrund auf Tippen, ohne die Karte zu verlassen.
function LeseCard({
  dossier,
  paragraphs,
  glossar,
}: {
  dossier: Dossier;
  paragraphs: string[];
  glossar: [string, string][];
}) {
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
        <p className="text-lg text-foreground/85 leading-relaxed">
          <GlossarText text={dossier.deck} glossar={glossar} />
        </p>
      )}
      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-3 text-[15px] text-foreground/80 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>
              <GlossarText text={p} glossar={glossar} />
            </p>
          ))}
        </div>
      )}
      <GlossarChips
        glossar={glossar}
        usedIn={[dossier.deck ?? "", ...paragraphs].join("\n")}
      />
    </CardShell>
  );
}

/* --------- Tippbare Glossar-Begriffe --------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Findet Glossar-Begriffe im Text und macht sie antippbar. Tippen klappt die
// Erklärung direkt unter dem Absatz auf (Toggle). Reiner Lese-Mehrwert, kein
// neues Datenfeld — nutzt das vorhandene `glossar`.
function GlossarText({
  text,
  glossar,
}: {
  text: string;
  glossar: [string, string][];
}) {
  const [open, setOpen] = useState<string | null>(null);

  const { nodes, hasMatch } = useMemo(() => {
    if (glossar.length === 0)
      return { nodes: [text] as React.ReactNode[], hasMatch: false };
    // Längste Begriffe zuerst, damit "Heizungsgesetz" vor "Gesetz" greift.
    const terms = glossar
      .map(([t]) => t)
      .filter((t) => t.trim().length > 1)
      .sort((a, b) => b.length - a.length);
    if (terms.length === 0)
      return { nodes: [text] as React.ReactNode[], hasMatch: false };
    const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    const defByLower = new Map(glossar.map(([t, d]) => [t.toLowerCase(), d]));
    const out: React.ReactNode[] = [];
    let match = false;
    text.split(re).forEach((chunk, i) => {
      const def = defByLower.get(chunk.toLowerCase());
      if (def && i % 2 === 1) {
        match = true;
        const isOpen = open?.toLowerCase() === chunk.toLowerCase();
        out.push(
          <button
            key={i}
            type="button"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={() => setOpen(isOpen ? null : chunk)}
            aria-expanded={isOpen}
            className={`underline decoration-dotted underline-offset-4 font-medium transition-colors ${
              isOpen ? "text-accent" : "text-foreground hover:text-accent"
            }`}
          >
            {chunk}
          </button>,
        );
      } else if (chunk) {
        out.push(chunk);
      }
    });
    return { nodes: out, hasMatch: match };
  }, [text, glossar, open]);

  const openDef =
    open != null
      ? glossar.find(([t]) => t.toLowerCase() === open.toLowerCase())?.[1] ?? null
      : null;

  return (
    <>
      {hasMatch ? nodes : text}
      <AnimatePresence initial={false}>
        {open && openDef && (
          <motion.span
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="block mt-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-snug text-foreground/85"
          >
            <span className="font-semibold text-foreground">{open}: </span>
            {openDef}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}

// Begriffe, die im Text nicht vorkommen, als antippbare Chips am Kartenende —
// so geht keine Erklärung verloren.
function GlossarChips({
  glossar,
  usedIn,
}: {
  glossar: [string, string][];
  usedIn: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const haystack = usedIn.toLowerCase();
  const leftover = glossar.filter(([t]) => !haystack.includes(t.toLowerCase()));
  if (leftover.length === 0) return null;
  const openDef =
    open != null ? leftover.find(([t]) => t === open)?.[1] ?? null : null;
  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl border border-foreground/10 p-4">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Kurz erklärt — antippen
      </h3>
      <div className="flex flex-wrap gap-2">
        {leftover.map(([term]) => {
          const isOpen = open === term;
          return (
            <button
              key={term}
              type="button"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={() => setOpen(isOpen ? null : term)}
              aria-expanded={isOpen}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isOpen
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              }`}
            >
              {term}
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {open && openDef && (
          <motion.p
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm leading-snug text-foreground/85"
          >
            <span className="font-semibold text-foreground">{open}: </span>
            {openDef}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------- Bild-Karussell --------- */

// Wischbares Karussell. Jedes Bild lädt mit onError-Guard; kaputte URLs werden
// automatisch ausgeblendet.
function GalleryCard({ images }: { images: DossierImage[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const visible = images.filter((img) => !broken.has(img.url));

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  function scrollTo(i: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <CardShell>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
        Zum Thema
      </span>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          // Horizontal-Wischen bleibt im Karussell, nicht beim Seiten-Blättern.
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((image) => (
            <figure
              key={image.url}
              className="w-full shrink-0 snap-center flex flex-col gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? image.caption ?? "Bild zum Thema"}
                onError={() => setBroken((prev) => new Set(prev).add(image.url))}
                className="w-full rounded-2xl border border-foreground/10 object-cover max-h-[52vh]"
              />
              {(image.caption || image.source) && (
                <figcaption className="text-xs text-muted-foreground leading-snug px-1">
                  {image.caption}
                  {image.source && (
                    <span className="text-foreground/45"> · {image.source}</span>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>

        {visible.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Vorheriges Bild"
              onClick={() => scrollTo(Math.max(0, active - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-9 rounded-full bg-background/70 backdrop-blur text-foreground hover:bg-background transition-colors disabled:opacity-0"
              disabled={active === 0}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Nächstes Bild"
              onClick={() => scrollTo(Math.min(visible.length - 1, active + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-9 rounded-full bg-background/70 backdrop-blur text-foreground hover:bg-background transition-colors disabled:opacity-0"
              disabled={active >= visible.length - 1}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {visible.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {visible.map((img, i) => (
            <span
              key={img.url}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      )}
    </CardShell>
  );
}

function ShortCard({ video }: { video: NonNullable<Dossier["video"]> }) {
  return (
    <CardShell>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-[0.18em]">
          <PlayCircle className="size-3.5" />
          Short ansehen
        </span>
        {video.runtime && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Clock className="size-3.5" />
            {video.runtime}
          </span>
        )}
      </div>
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
