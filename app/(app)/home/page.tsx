"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalSession, type LocalSession } from "@/lib/local/session";
import { getLocalState, type LocalState } from "@/lib/local/state";
import { buildPfadStops, type PfadStop } from "@/lib/data/pfad-stops";
import { getPartyById } from "@/lib/spektrum/parties";
import { buttonVariants } from "@/components/ui/button";
import {
  Check,
  Lock,
  Play,
  Vote,
  Mic,
  Crown,
  UserPlus,
  ArrowRight,
  X,
} from "lucide-react";

// Clean iOS-Homescreen — minimal, scrollbar (Datum liegt jetzt im Balken/TopNav):
// 1. Heute-Hero (konkretes Briefing-Thema) — nur Headline + Spiel-/Öffnen-Button,
//    KEIN Haken und KEIN Countdown hier (der einzige Haken lebt im Pfad).
// 2. Versetzter, scrollbarer Pfad: Vergangenheit (oben, gespielt/verpasst) →
//    heute (zentriert, einziger Haken) → Zukunft (unten) inkl. Events.
// 3. Gast-CTA wenn anonym

export default function HomePage() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [state, setState] = useState<LocalState | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [hydrated, setHydrated] = useState(false);
  const [todayInfo, setTodayInfo] = useState<{
    kicker: string | null;
    headline: string;
  } | null>(null);

  useEffect(() => {
    setSession(getLocalSession());
    setState(getLocalState());
    setHydrated(true);
    // Echtes Tages-Dossier laden (für Hero + heutigen Pfad-Knoten) statt Seed.
    fetch("/api/today")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.headline) {
          setTodayInfo({ kicker: d.kicker ?? null, headline: d.headline });
        }
      })
      .catch(() => {});
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated || !state) return <Skeleton />;

  const isGuest = !session?.isRegistered;
  const playedToday = !!state.last_briefing_date;

  // An welchen Tagen wurde wirklich gespielt? Aus den Entscheidungen (volle
  // ISO-Strings → Tag) plus dem letzten Briefing-Datum. Daraus weiss der Pfad
  // für jeden vergangenen Tag: gespielt (Haken) oder verpasst.
  const playedDates = new Set<string>(
    state.decisions.map((d) => d.date.slice(0, 10)),
  );
  if (state.last_briefing_date) playedDates.add(state.last_briefing_date);

  const stops = buildPfadStops(now, todayInfo ?? undefined, playedDates);
  const todayStop = stops.find((s) => s.status === "today") ?? stops[0];
  const party = state.party_id ? getPartyById(state.party_id) : null;

  // Past/Future-Anker: User soll bei Aufruf auf Heute landen, kann hoch+runter
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-12 gap-4">
      {/* Heute-Hero (konkretes Briefing-Thema) */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
          Heute
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {todayStop.kicker}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            {todayStop.headline}
          </h1>
        </div>
        {/* Nur ein Button — gespielt oder nicht. Der "gespielt"-Haken lebt
            ausschliesslich im Pfad (heutiger Knoten), nicht hier. Kein
            Countdown / keine "nächste Ausgabe"-Zeit mehr. */}
        <Link
          href="/heute"
          className={
            buttonVariants({ size: "lg" }) +
            " h-12 group self-stretch inline-flex items-center justify-center"
          }
        >
          <Play className="size-4 mr-2" fill="currentColor" />
          {playedToday ? "Briefing öffnen" : "Jetzt spielen"}
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>

      {/* Versetzter, scrollbarer Pfad */}
      <section className="flex flex-col mt-2">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-on-bg text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Dein Pfad
          </h2>
          {party && (
            <span className="text-on-bg inline-flex items-center gap-1.5 text-xs text-foreground/70">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: party.color }}
                aria-hidden
              />
              {party.shortName}
            </span>
          )}
        </header>
        {/* recenterKey = heutige Headline: ändert sich, sobald das echte
            Dossier nachgeladen ist → Pfad scrollt erneut sauber auf heute. */}
        <ZigzagPath
          stops={stops}
          playedToday={playedToday}
          recenterKey={todayStop.headline}
        />
      </section>

      {/* Gast-CTA */}
      {isGuest && (
        <Link
          href="/onboarding"
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-foreground/[0.02] transition-all mt-2"
        >
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-ink text-background shrink-0">
            <UserPlus className="size-4" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold leading-tight">
              Spielstand sichern
            </span>
            <span className="text-xs text-muted-foreground">
              Du spielst als Gast — Konto erstellen für Sync.
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      )}
    </main>
  );
}

/** Duolingo-Style-Pfad: grosse Knoten in zentrierter Mittellinie, leicht
 *  zigzag versetzt. Knoten skalieren responsiv (Mobile 64–80 px, Desktop
 *  bis 112 px). Label klein UNTER dem Knoten. Auto-Scroll zu Heute. */
function ZigzagPath({
  stops,
  playedToday,
  recenterKey,
}: {
  stops: PfadStop[];
  playedToday: boolean;
  recenterKey: string;
}) {
  // Beim Öffnen soll heute OBEN stehen (grüner Haken direkt sichtbar);
  // vergangene Tage liegen darüber und sind nur per Hochscrollen erreichbar.
  // Plus: kleiner "Heute"-Button blendet sich ein, wenn der User wegscrollt.
  const [showJump, setShowJump] = useState(false);
  // Sobald der User selbst scrollt/wischt, kein automatisches Zurückspringen
  // mehr — wir reissen ihn dann nicht aus der Vergangenheit zurück.
  const userEngaged = useRef(false);

  const centerOnToday = useCallback((smooth: boolean, auto = false) => {
    if (auto && userEngaged.current) return;
    const el = document.getElementById("pfad-today");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Today landet direkt unter der TopNav (h-14 = 56px) — der gestrige Knoten
    // fällt oben raus, der User sieht heute zuoberst + Zukunft. Vergangenes
    // erreicht man nur durch Hochscrollen.
    const TOP_OFFSET = 64; // px unterhalb des Viewport-Anfangs (knapp unter Nav)
    const targetY = rect.top + window.scrollY - TOP_OFFSET;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: smooth ? "smooth" : ("instant" as ScrollBehavior),
    });
  }, []);

  // Eigene Scroll-/Wisch-Interaktion merken (deaktiviert Auto-Recenter).
  useEffect(() => {
    function markEngaged() {
      userEngaged.current = true;
    }
    const opts = { passive: true } as const;
    window.addEventListener("wheel", markEngaged, opts);
    window.addEventListener("touchmove", markEngaged, opts);
    window.addEventListener("keydown", markEngaged);
    return () => {
      window.removeEventListener("wheel", markEngaged);
      window.removeEventListener("touchmove", markEngaged);
      window.removeEventListener("keydown", markEngaged);
    };
  }, []);

  // Auto-Scroll auf heute — beim Mount UND erneut, sobald das echte Dossier
  // geladen ist (recenterKey ändert sich → Hero wird höher → Layout rutscht).
  // Mehrere Versuche, weil der Layout-Shift nach dem Fetch verzögert kommt.
  useEffect(() => {
    const raf = requestAnimationFrame(() => centerOnToday(false, true));
    const timers = [120, 400, 800].map((ms) =>
      window.setTimeout(() => centerOnToday(false, true), ms),
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [recenterKey, centerOnToday]);

  // "Heute"-Button zeigen, wenn der heutige Knoten weit weg ist (hoch ODER runter).
  useEffect(() => {
    function onScroll() {
      const el = document.getElementById("pfad-today");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offscreen = rect.bottom < 60 || rect.top > window.innerHeight - 60;
      setShowJump(offscreen);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 5 Zigzag-Positionen, damit der Pfad "schlängelt" wie bei Duolingo
  const offsets = [
    "translate-x-0",
    "translate-x-[22%]",
    "translate-x-[14%]",
    "-translate-x-[14%]",
    "-translate-x-[22%]",
  ];

  return (
    <>
      <ol className="relative flex flex-col items-center gap-6 sm:gap-8 py-4">
        {stops.map((stop, i) => (
          <PfadNode
            key={stop.date + i}
            stop={stop}
            // Heute steht mittig ("in der Mitte"), der Rest schlängelt drumherum.
            offsetClass={stop.status === "today" ? "translate-x-0" : offsets[i % offsets.length]}
            playedToday={playedToday}
          />
        ))}
      </ol>
      {showJump && (
        <button
          type="button"
          onClick={() => centerOnToday(true)}
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-30 inline-flex items-center gap-2 rounded-full bg-gold text-gold-ink px-4 py-2.5 text-sm font-bold shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-transform"
          style={{ bottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
        >
          <Play className="size-3.5" fill="currentColor" />
          Zurück zu Heute
        </button>
      )}
    </>
  );
}

function PfadNode({
  stop,
  offsetClass,
  playedToday,
}: {
  stop: PfadStop;
  offsetClass: string;
  playedToday: boolean;
}) {
  const isEvent = !!stop.eventTag;
  // Heute-Knoten gilt nach gespieltem Briefing als erledigt: grün mit Haken
  // statt goldenem Play. Der Anker (id="pfad-today") bleibt am selben Knoten.
  const isToday = stop.status === "today";
  const isDone = stop.status === "done" || (isToday && playedToday);
  const isMissed = stop.status === "missed";
  const isLocked = stop.status === "locked" && !isEvent;
  // Vergangene Tage sind nicht anklickbar (kein Archiv-Ziel) — wie Locked.
  const isStatic = isLocked || isDone || isMissed;

  // Duolingo-mässig grosse Knoten. Mobile 64 px (done/locked) bis 80 px
  // (today), Desktop bis 112 px für Today.
  const markerSize = isToday
    ? "size-20 sm:size-28"
    : isEvent
      ? "size-18 sm:size-24"
      : "size-16 sm:size-20";

  // Locked-Knoten brauchen einen opaken Wash, damit sie ueber dem Reichstag
  // erkennbar bleiben. backdrop-blur greift den Glass-Look der Cards auf.
  let markerBg =
    "bg-background/85 border border-foreground/15 backdrop-blur-sm text-foreground/55";
  let iconSize = "size-7 sm:size-9";
  let markerIcon: React.ReactNode = <Lock className={iconSize} />;
  if (isDone) {
    markerBg = "bg-success text-white shadow-[0_6px_0_-2px] shadow-success/40";
    // Der erledigte Heute-Knoten ist gross — Haken mitskalieren.
    if (isToday) iconSize = "size-9 sm:size-12";
    markerIcon = <Check className={iconSize} strokeWidth={3} />;
  } else if (isToday) {
    markerBg = "bg-gold text-gold-ink shadow-[0_8px_0_-2px] shadow-yellow-700/40";
    iconSize = "size-9 sm:size-12";
    markerIcon = <Play className={iconSize + " ml-1"} fill="currentColor" />;
  } else if (isMissed) {
    // Verpasst: neutral-gedämpft (kein Rot), schwaches X — klar abgesetzt vom
    // grünen Haken der gespielten Tage.
    markerBg =
      "bg-background/70 border border-foreground/10 backdrop-blur-sm text-foreground/35";
    markerIcon = <X className={iconSize} strokeWidth={2.5} />;
  } else if (isEvent) {
    markerBg = "bg-pp-red text-white shadow-[0_6px_0_-2px] shadow-red-900/40";
    iconSize = "size-7 sm:size-9";
    if (stop.eventTag === "triell") markerIcon = <Mic className={iconSize} />;
    else if (stop.eventTag === "wahl") markerIcon = <Crown className={iconSize} />;
    else markerIcon = <Vote className={iconSize} />;
  }

  const Marker = (
    <div
      id={isToday ? "pfad-today" : undefined}
      className={`relative ${markerSize} rounded-full flex items-center justify-center shrink-0 transition-transform ${markerBg} ${
        isStatic ? "" : "hover:scale-105 active:scale-95"
      }`}
    >
      {markerIcon}
      {isEvent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-pp-red px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-sm">
          {stop.eventTag === "wahl" ? "Wahl" : stop.eventTag === "triell" ? "Triell" : "Wahlkampf"}
        </span>
      )}
    </div>
  );

  // Locked Daily-Stops (keine Wahlkampf-Events) zeigen das Thema NICHT —
  // die Redaktion entscheidet jeden Morgen neu, darum kein Spoiler.
  const Label = (
    <div className="flex flex-col items-center leading-tight gap-0.5 mt-2 text-center max-w-[160px] sm:max-w-[200px]">
      <span className="text-on-bg text-xs font-mono tabular-nums text-foreground/65">
        {stop.weekdayShort}, {stop.dayNumber}. {stop.monthShort}
      </span>
      {isLocked && !isEvent ? (
        <span className="text-on-bg text-xs sm:text-sm italic text-foreground/55">
          Wird freigeschaltet
        </span>
      ) : (
        <span
          className={`text-on-bg text-xs sm:text-sm leading-snug ${
            isToday
              ? "font-serif font-semibold text-foreground"
              : isMissed
                ? "text-foreground/45"
                : "text-foreground/85"
          } line-clamp-2`}
        >
          {stop.headline}
        </span>
      )}
    </div>
  );

  const content = (
    <div className={`flex flex-col items-center ${offsetClass} transition-transform`}>
      {Marker}
      {Label}
    </div>
  );

  if (isStatic) return <li>{content}</li>;
  return (
    <li>
      <Link href={stop.href} className="block">
        {content}
      </Link>
    </li>
  );
}

function Skeleton() {
  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 pt-3 pb-6 gap-4">
      <div className="h-4 w-1/3 rounded bg-foreground/5 animate-pulse" />
      <div className="h-44 rounded-3xl bg-foreground/5 animate-pulse" />
      <div className="h-16 rounded-2xl bg-foreground/5 animate-pulse" />
      <div className="h-96 rounded-2xl bg-foreground/5 animate-pulse mt-4" />
    </main>
  );
}
