"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type {
  ChoiceId,
  Dossier,
  DossierChoice,
  DossierImage,
  DossierRole,
} from "@/lib/supabase/types";
import { useDecision } from "@/lib/briefing/useDecision";
import { resolveFormat } from "@/lib/dossier/format";
import { getLocalState } from "@/lib/local/state";
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
  X,
  Volume2,
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
  // Politische Rolle des Nutzers (lokal, aus der Wahl). Erst nach Mount aus
  // localStorage lesbar → Default beim ersten Render, danach echte Rolle. Ein
  // "kandidat" (vor der ersten Wahl) zählt als Opposition — so bekommt er die
  // Oppositions-Aufgabe, passend zur Profil-Anzeige ("Opposition").
  const [role, setRole] = useState<DossierRole>("kandidat");
  useEffect(() => {
    setRole(getLocalState().role);
  }, []);
  const taskRole: DossierRole = role === "kandidat" ? "opposition" : role;

  // Rollenabhängige Tagesaufgabe (V3): gibt es für die Rolle eine Variante,
  // ersetzt sie Format + Interaktions-Nutzdaten (meinung/faktencheck/choices).
  // Sonst bleibt alles wie gehabt (abwärtskompatibel — alte Dossiers haben
  // kein role_variants, dann ist `effective` === `dossier`).
  const effective = useMemo<Dossier>(() => {
    const v = dossier.role_variants?.[taskRole];
    if (!v) return dossier;
    return {
      ...dossier,
      format: v.format ?? dossier.format,
      streitfrage: v.streitfrage ?? dossier.streitfrage,
      meinung: v.meinung ?? dossier.meinung,
      faktencheck: v.faktencheck ?? dossier.faktencheck,
      choices: v.choices ?? dossier.choices,
      consequences: v.consequences ?? dossier.consequences,
    };
  }, [dossier, taskRole]);

  const { chosen, consequence, choose, submitting } = useDecision(effective);

  const format = resolveFormat(effective, taskRole);
  const isMeinung =
    format === "meinung" && (effective.meinung?.optionen?.length ?? 0) >= 2;
  const isFaktencheck =
    format === "faktencheck" && !!effective.faktencheck?.behauptung;
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

  // KI-Erklärvideo (eigenes mp4 aus der Remotion-Pipeline) vs. klassischer
  // YouTube-Short. Erkennung: explizit per kind ODER an der Dateiendung.
  const isExplainer = useMemo(() => {
    const v = dossier.video;
    if (!v?.url) return false;
    return v.kind === "ai-explainer" || /\.mp4(\?|#|$)/i.test(v.url);
  }, [dossier]);

  // Short nur, wenn URL da UND Länge ≤ 3 Min (oder keine Länge angegeben —
  // dann verlässt sich die UI auf die Redaktions-Regel). Ein erkennbar zu
  // langer Clip wird komplett unterdrückt. Das eigene Erklärvideo kontrollieren
  // wir selbst → keine harte Längen-Grenze.
  const videoOk = useMemo(() => {
    if (!dossier.video?.url) return false;
    if (isExplainer) return true;
    const secs = runtimeSeconds(dossier.video.runtime);
    return secs === null || secs <= MAX_VIDEO_SECONDS;
  }, [dossier, isExplainer]);

  const preSteps = useMemo<StepKind[]>(() => {
    const s: StepKind[] = [];
    if (isExplainer && videoOk) {
      // Video-First: das Erklärvideo ist die Hauptkarte. Der volle Artikeltext
      // steckt als optionaler "Text öffnen"-Toggle IN der Video-Karte — also
      // kein eigener "lesen"-Schritt mehr.
      s.push("short");
      if (gallery.length > 0) s.push("image");
    } else {
      // Klassisch: Lesen zuerst, optionaler YouTube-Short dazwischen.
      s.push("lesen");
      if (gallery.length > 0) s.push("image");
      if (videoOk) s.push("short");
    }
    s.push(interaction);
    return s;
  }, [isExplainer, gallery, videoOk, interaction]);

  // Outcome wird erst nach der Wahl Teil des Decks.
  const steps: StepKind[] =
    interaction === "decision" && chosen ? [...preSteps, "outcome"] : preSteps;
  // Outcome nur beim Entscheidungs-Format; meinung/faktencheck sind selbst der Schluss.
  const totalDots = interaction === "decision" ? preSteps.length + 1 : preSteps.length;

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const current = steps[Math.min(index, steps.length - 1)];

  const atFirst = index === 0;
  // Vor der Entscheidung frei vor/zurück; auf der Entscheidung nur weiter, wenn
  // schon gewählt — dann zum Outcome (Nachlesen), die Wahl selbst ist gesperrt.
  const canNext =
    (current !== "decision" || !!chosen) && index < steps.length - 1;

  function paginate(next: number) {
    const target = index + next;
    if (target < 0 || target > steps.length - 1) return;
    if (next > 0 && current === "decision" && !chosen) return; // Gate: erst wählen
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
            {current === "short" &&
              dossier.video?.url &&
              (isExplainer ? (
                <ExplainerCard
                  dossier={dossier}
                  paragraphs={body}
                  glossar={glossar}
                />
              ) : (
                <ShortCard video={dossier.video} />
              ))}
            {current === "decision" && (
              <DecisionCard
                dossier={effective}
                chosen={chosen}
                submitting={submitting}
                onChoose={onChoose}
              />
            )}
            {current === "meinung" && (
              <CardShell>
                <MeinungSection
                  dossier={effective}
                  onComplete={() => setFormatDone(true)}
                />
              </CardShell>
            )}
            {current === "faktencheck" && (
              <CardShell>
                <FaktencheckSection
                  dossier={effective}
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

        {current === "decision" && !chosen ? (
          // Kein "Wähle, um fortzufahren"-Hinweis mehr — die Auswahl-Karten sind
          // selbsterklärend. Leerer Platzhalter hält das Footer-Layout balanciert.
          <span aria-hidden />
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
            <span aria-hidden />
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
  // Offenes Vorkommen per Split-Index (nicht per Begriff): so klappt genau das
  // GETIPPTE Vorkommen auf und die Erklärung sitzt direkt darunter — nicht am
  // Absatzende, und nicht alle gleichen Begriffe gleichzeitig.
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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
        const isOpen = openIdx === i;
        out.push(
          <button
            key={`t-${i}`}
            type="button"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={() => setOpenIdx(isOpen ? null : i)}
            aria-expanded={isOpen}
            className={`underline decoration-dotted underline-offset-4 font-medium transition-colors ${
              isOpen ? "text-accent" : "text-foreground hover:text-accent"
            }`}
          >
            {chunk}
          </button>,
        );
        if (isOpen) {
          // Block-level → bricht den Inline-Fluss, sitzt also unmittelbar unter
          // dem Begriff; der restliche Absatz fließt darunter weiter.
          out.push(
            <motion.span
              key={`d-${i}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="block my-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-snug text-foreground/85"
            >
              <span className="font-semibold text-foreground">{chunk}: </span>
              {def}
            </motion.span>,
          );
        }
      } else if (chunk) {
        out.push(chunk);
      }
    });
    return { nodes: out, hasMatch: match };
  }, [text, glossar, openIdx]);

  return <>{hasMatch ? nodes : text}</>;
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
        Kurz erklärt
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
              {/* Festes 4:3-Fenster + object-cover object-center: einheitliche,
                  sauber gerahmte Karten statt seitlich/oben abgeschnittener
                  Bilder. Gut beschnitten zusammen mit der themenspezifischen
                  Bildquelle (Personen statt Logos). */}
              <div className="w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04] aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt ?? image.caption ?? "Bild zum Thema"}
                  onError={() => setBroken((prev) => new Set(prev).add(image.url))}
                  className="h-full w-full object-cover object-center"
                />
              </div>
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

// Video-First-Hauptkarte: das KI-Erklärvideo läuft als nativer <video>-Player,
// der volle Artikeltext (mit antippbarem Glossar) steckt darunter hinter einem
// optionalen "Text öffnen"-Schalter — Standard ist zu.
function ExplainerCard({
  dossier,
  paragraphs,
  glossar,
}: {
  dossier: Dossier;
  paragraphs: string[];
  glossar: [string, string][];
}) {
  const [showText, setShowText] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = dossier.video!;

  // Auto-Start wie bei Social Media: Browser erlauben das nur STUMM. Die
  // Untertitel sind eingebrannt → der Inhalt kommt trotzdem rüber; ein Tipp
  // schaltet den Ton dazu. Ref stellt sicher, dass muted gesetzt ist, bevor
  // play() läuft (sonst blockt iOS den Auto-Start).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p) p.catch(() => {});
  }, []);

  function unmute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    const p = v.play();
    if (p) p.catch(() => {});
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black flex flex-col">
      {/* Vollflächiges Video — Social-Media-Optik. Startet automatisch (stumm) +
          Loop; "Tippen für Ton" schaltet den Ton zu. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={video.url ?? undefined}
        poster={video.poster}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
        controls
        // Eigene Steuerung (Play/Scrub) soll nicht das Karten-Wischen auslösen.
        onPointerDownCapture={(e) => e.stopPropagation()}
        className="absolute inset-0 h-full w-full object-contain bg-black"
      />

      {/* Solange stumm: ganzflächiger "Tippen für Ton"-Layer (über dem Video,
          unter Top-Leiste/Text-Sheet). Nach dem Ton-Einschalten verschwindet er
          und die nativen Controls sind frei. */}
      {muted && (
        <button
          type="button"
          onClick={unmute}
          onPointerDownCapture={(e) => e.stopPropagation()}
          aria-label="Ton einschalten"
          className="absolute inset-0 z-10 flex items-end justify-center pb-24"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
            <Volume2 className="size-4" />
            Tippen für Ton
          </span>
        </button>
      )}

      {/* Top-Leiste über sanftem Verlauf: Kicker links, "Text öffnen" rechts.
          Bewusst OBEN, damit nichts die nativen Video-Steuerungen (unten)
          überdeckt. */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-black/60 via-black/20 to-transparent px-4 pt-4 pb-12">
        <span className="pointer-events-none inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          <PlayCircle className="size-3.5 shrink-0" />
          <span className="truncate">{dossier.kicker ?? "Tagesbriefing"}</span>
        </span>
        <button
          type="button"
          onClick={() => setShowText(true)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-ink shadow backdrop-blur transition-transform hover:scale-105 active:scale-95"
        >
          <Newspaper className="size-3.5" />
          Text öffnen
        </button>
      </div>

      {/* Text als hochschiebendes Sheet (Social-Media-Style). */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onPointerDownCapture={(e) => e.stopPropagation()}
            className="absolute inset-0 z-20 flex flex-col bg-background"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Newspaper className="size-3.5" />
                {dossier.kicker ?? "Zum Thema"}
              </span>
              <button
                type="button"
                onClick={() => setShowText(false)}
                aria-label="Schließen"
                className="inline-flex size-9 items-center justify-center rounded-full text-foreground hover:bg-foreground/5"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      {/* Kicker "Du sitzt am Tisch" entfernt — die Streitfrage ("Du sitzt im
          Kabinett …") sagt dasselbe; doppelter Text raus. */}
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
      {chosen && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <Check className="size-3.5 text-success" strokeWidth={3} />
          Du hast dich entschieden — diese Wahl ist endgültig.
        </p>
      )}
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
        <div className="flex flex-col gap-1 mt-1 pt-3 border-t border-foreground/10">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em] mb-1">
            Quellen
          </h3>
          <ul className="flex flex-col">
            {sources.map((s, i) => (
              <li key={i}>
                {/* Aufgeräumt: Icon + Titel auf EINER Zeile (gekürzt) + Outlet
                    klein darunter — kein wirres Umbrechen mehr. */}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-xl -mx-2 px-2 py-2 hover:bg-foreground/5 transition-colors"
                >
                  <ExternalLink className="size-4 shrink-0 text-foreground/35 group-hover:text-foreground/60" />
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm text-foreground/80 leading-snug line-clamp-1">
                      {s.title}
                    </span>
                    {s.outlet && (
                      <span className="text-xs text-foreground/45">{s.outlet}</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
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
