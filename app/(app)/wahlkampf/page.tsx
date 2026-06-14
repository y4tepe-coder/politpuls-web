"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  parties,
  getPartyById,
  CUSTOM_PARTY_ID,
  CUSTOM_PARTY_COLORS,
} from "@/lib/spektrum/parties";
import { getLocalState, updateLocalState, type LocalRole } from "@/lib/local/state";
import { CustomPartyEditor } from "@/components/party/CustomPartyEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Crown,
  Briefcase,
  Megaphone,
  ShieldCheck,
  Flag,
  Flame,
  Check,
  Lock,
  ChevronRight,
} from "lucide-react";

const ROLES: {
  id: LocalRole;
  title: string;
  icon: React.ReactNode;
  blurb: string;
  unlock: string;
}[] = [
  {
    id: "kandidat",
    title: "Kandidat",
    icon: <Flag className="size-5" />,
    blurb:
      "Du startest hier. Jeden Tag eine Entscheidung, jeden Monat eine Wahl — wenn du gut spielst, klettert deine Partei nach oben.",
    unlock: "Aktiv ab Tag 1",
  },
  {
    id: "minister",
    title: "Minister",
    icon: <Briefcase className="size-5" />,
    blurb:
      "Wenn deine Partei Platz 2–4 holt und in die Koalition passt, bekommst du ein Ressort. Du verantwortest jetzt ein Themenfeld.",
    unlock: "Nach erfolgreicher Wahl",
  },
  {
    id: "kanzler",
    title: "Bundeskanzler",
    icon: <Crown className="size-5" />,
    blurb:
      "Wenn deine Partei Platz 1 holt, übernimmst du die Regierung. Jetzt zählen Außenpolitik, Haushalt, Krisen-Management.",
    unlock: "Wenn deine Partei #1 wird",
  },
  {
    id: "opposition",
    title: "Opposition",
    icon: <Megaphone className="size-5" />,
    blurb:
      "Wenn es nicht für eine Koalition reicht: Du wirst zur lautesten Stimme im Bundestag. Andere Spielmechanik, gleicher Einfluss.",
    unlock: "Wenn keine Koalition passt",
  },
];

// Der Wahlkampf-Pfad: 5 Schritte, EINER pro Tag freigeschaltet (Duolingo-Style).
const PHASES: { id: string; title: string; href: string }[] = [
  { id: "programm", title: "Wahlprogramm schreiben", href: "/wahlkampf/programm" },
  { id: "plakat", title: "Plakat & Slogan", href: "/wahlkampf/plakat" },
  { id: "faktspin", title: "Fakt oder Spin?", href: "/wahlkampf/fakt-oder-spin" },
  { id: "triell", title: "TV-Triell führen", href: "/wahlkampf/tv-triell" },
  { id: "wahl", title: "Wahlsonntag", href: "/wahlkampf/wahl" },
];

// Berlin-Datum (YYYY-MM-DD) + Tage seit Kampagnenstart — Basis der
// "ein Schritt pro Tag wird frei"-Logik.
function berlinToday(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(),
  );
}
function daysSince(startISO: string): number {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const t = berlinToday().split("-").map(Number);
  return Math.floor(
    (Date.UTC(t[0], t[1] - 1, t[2]) - Date.UTC(sy, sm - 1, sd)) / 86_400_000,
  );
}

export default function WahlkampfPage() {
  const [role, setRole] = useState<LocalRole>("kandidat");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState<string>(CUSTOM_PARTY_COLORS[0]);
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const local = getLocalState();
    setRole(local.role);
    setPartyId(local.party_id);
    if (local.custom_party) {
      setCustomName(local.custom_party.name);
      setCustomColor(local.custom_party.color);
    }
    setStarted(local.campaign_started_date);
    setDone({
      programm: local.campaign_themen.length > 0,
      plakat: !!local.campaign_plakat,
      faktspin: local.campaign_faktspin_done,
      triell: Object.keys(local.campaign_triell_answers).length > 0,
      wahl: local.role !== "kandidat",
    });
    setHydrated(true);
  }, []);

  const isCustom = partyId === CUSTOM_PARTY_ID;

  function handleSelectParty(pid: string) {
    setPartyId(pid);
    updateLocalState({ party_id: pid, custom_party: null });
  }

  function selectCustomParty() {
    setPartyId(CUSTOM_PARTY_ID);
    persistCustom(customName, customColor);
  }

  function persistCustom(name: string, color: string) {
    setCustomName(name);
    setCustomColor(color);
    const trimmed = name.trim();
    updateLocalState({
      party_id: CUSTOM_PARTY_ID,
      custom_party: trimmed
        ? { name: trimmed, shortName: trimmed.slice(0, 6).toUpperCase(), color }
        : { name: "", shortName: "PARTEI", color },
    });
  }

  function startCampaign() {
    const t = berlinToday();
    setStarted(t);
    updateLocalState({ campaign_started_date: t });
  }

  // Tages-Freischaltung: ab campaign_started_date wird pro Kalendertag EIN
  // Schritt frei — und nur in Reihenfolge. So wird der Wahlkampf zum täglichen
  // Pfad statt an einem Tag durchklickbar.
  const dayIndex = started ? daysSince(started) : -1;
  const steps = PHASES.map((p, i) => {
    const isDone = !!done[p.id];
    const prevDone = PHASES.slice(0, i).every((q) => done[q.id]);
    const status: "done" | "today" | "locked" = isDone
      ? "done"
      : started && prevDone && dayIndex >= i
        ? "today"
        : "locked";
    return { ...p, status, unlocksIn: Math.max(0, i - dayIndex) };
  });
  const doneCount = steps.filter((s) => s.status === "done").length;
  const finished = hydrated && started !== null && doneCount >= PHASES.length;

  const selectedParty = partyId ? getPartyById(partyId) : null;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-8">
      <header className="flex flex-col gap-2 text-on-bg">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Wahlkampf-Modus
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Führe deine eigene Partei.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Dein zweiter Pfad neben dem täglichen Briefing: Jeden Tag ein
          Wahlkampf-Schritt — Programm, Plakat, Medien-Check, TV-Triell — bis
          zum Wahltag. Dranbleiben hält dein Funkeln am Leben.
        </p>
      </header>

      {/* Wahlkampf-Pfad: Start / Fortschritt */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 flex items-start gap-4">
        <span className="inline-flex items-center justify-center size-12 rounded-xl bg-pp-red text-white shrink-0">
          <Flame className="size-6" />
        </span>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Dein Wahlkampf-Pfad
          </span>
          {!hydrated ? (
            <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug">
              …
            </h2>
          ) : !started ? (
            <>
              <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug">
                Starte deinen Wahlkampf — ein Schritt pro Tag.
              </h2>
              <p className="text-sm text-muted-foreground">
                Wie bei Duolingo: Jeden Tag schaltet sich der nächste Schritt
                frei, bis zum Wahltag. Erst deine Partei wählen, dann los.
              </p>
              <Button
                onClick={startCampaign}
                size="lg"
                className="h-11 mt-1 w-full sm:w-auto"
              >
                <Flame className="size-4 mr-1.5" />
                Wahlkampf starten
              </Button>
            </>
          ) : finished ? (
            <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug">
              Wahlkampf abgeschlossen — bereit für die nächste Runde.
            </h2>
          ) : (
            <>
              <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug">
                Schritt {Math.min(doneCount + 1, PHASES.length)} von {PHASES.length}
              </h2>
              <p className="text-sm text-muted-foreground">
                Heute ist dein nächster Schritt frei. Jeden Tag einer — dranbleiben fürs Funkeln.
              </p>
              <div className="flex items-center gap-1.5 mt-1" aria-hidden>
                {steps.map((s) => (
                  <span
                    key={s.id}
                    className={`h-1.5 flex-1 rounded-full ${
                      s.status === "done"
                        ? "bg-pp-red"
                        : s.status === "today"
                          ? "bg-pp-red/40"
                          : "bg-foreground/15"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deine Partei — fiktiv & überparteilich (du gründest deine eigene) */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1 text-on-bg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Gründe deine Partei
          </h2>
          <p className="text-sm text-muted-foreground">
            Du führst deine <span className="font-medium text-foreground">eigene</span> Partei —
            überparteilich. (Du kannst auch für eine bestehende antreten.)
          </p>
        </header>

        {/* Eigene Partei zuerst */}
        <button
          type="button"
          onClick={selectCustomParty}
          className={`rounded-xl border-2 border-dashed p-4 flex items-center gap-3 transition-all text-left ${
            isCustom
              ? "bg-card shadow-sm"
              : "border-foreground/25 hover:bg-foreground/5"
          }`}
          style={
            isCustom
              ? { borderColor: customColor, borderStyle: "solid", boxShadow: `0 0 0 1px ${customColor}` }
              : undefined
          }
        >
          <span
            className="inline-flex items-center justify-center size-9 rounded-full text-white shrink-0"
            style={{ backgroundColor: customColor }}
            aria-hidden
          >
            <Flag className="size-4" />
          </span>
          <span className="font-serif font-semibold text-base">
            {isCustom && customName.trim() ? customName : "Eigene Partei gründen"}
          </span>
        </button>

        {isCustom && (
          <div className="mt-1">
            <CustomPartyEditor
              name={customName}
              color={customColor}
              onName={(v) => persistCustom(v, customColor)}
              onColor={(v) => persistCustom(customName, v)}
            />
          </div>
        )}

        {/* Bestehende Parteien als Alternative */}
        <details className="mt-1">
          <summary className="text-xs text-muted-foreground cursor-pointer select-none">
            Lieber für eine bestehende Partei antreten?
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
            {parties.map((party) => {
              const isSelected = partyId === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  onClick={() => handleSelectParty(party.id)}
                  className={`relative rounded-xl border p-3 flex items-center justify-center min-h-[56px] transition-all text-center ${
                    isSelected
                      ? "bg-card shadow-sm scale-[1.02]"
                      : "border-border bg-card hover:bg-foreground/5"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: party.color, boxShadow: `0 0 0 1px ${party.color}` }
                      : undefined
                  }
                >
                  <span className="font-serif font-semibold text-sm">
                    {party.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </details>

        {selectedParty && selectedParty.name.trim() && (
          <p className="text-xs text-muted-foreground mt-1 text-on-bg">
            Du trittst als <span className="font-medium text-foreground">{selectedParty.name}</span> an.
          </p>
        )}
      </section>

      {/* Campaign phases — Tages-Pfad mit Freischaltung */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1 text-on-bg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Der Wahlkampf-Pfad
          </h2>
          <p className="text-sm text-muted-foreground">
            Fünf Schritte bis zur Wahl — einer pro Tag. Erledigte bleiben offen
            zum Nachschauen.
          </p>
        </header>
        <ol className="flex flex-col gap-2.5">
          {steps.map((step) => {
            const locked = step.status === "locked";
            const isToday = step.status === "today";
            const isDoneStep = step.status === "done";
            const inner = (
              <>
                <span className="relative inline-flex items-center justify-center size-9 shrink-0">
                  {isToday && (
                    <span
                      className="absolute inset-0 rounded-full bg-pp-red/30 animate-ping"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`relative inline-flex items-center justify-center size-9 rounded-full text-sm font-bold ${
                      isDoneStep || isToday
                        ? "bg-pp-red text-white"
                        : "bg-foreground/10 text-muted-foreground"
                    }`}
                  >
                    {isDoneStep ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : locked ? (
                      <Lock className="size-4" />
                    ) : (
                      <Flame className="size-4" />
                    )}
                  </span>
                </span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span className="font-serif text-base font-semibold leading-snug">
                    {step.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isDoneStep
                      ? "Erledigt"
                      : isToday
                        ? "Heute frei"
                        : !started
                          ? "Erst Wahlkampf starten"
                          : `Schaltet in ${step.unlocksIn} ${step.unlocksIn === 1 ? "Tag" : "Tagen"} frei`}
                  </span>
                </span>
                {!locked && (
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                )}
              </>
            );
            return (
              <li key={step.id}>
                {locked ? (
                  <div className="glass-card opacity-55 rounded-xl p-4 flex items-center gap-4 min-h-[64px] cursor-not-allowed">
                    {inner}
                  </div>
                ) : (
                  <Link
                    href={step.href}
                    className={`group glass-card text-foreground hover:bg-foreground/5 rounded-xl p-4 flex items-center gap-4 transition-all min-h-[64px] ${
                      isToday ? "ring-2 ring-pp-red/50" : ""
                    }`}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Roles */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1 text-on-bg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Die vier Rollen
          </h2>
          <p className="text-sm text-muted-foreground">
            Welche Rolle du am Ende einer Wahl bekommst, hängt davon ab, wie
            gut du gespielt hast — und wer mit wem koaliert.
          </p>
        </header>
        <ul className="flex flex-col gap-3">
          {ROLES.map((r) => {
            const isCurrent = r.id === role;
            return (
              <li
                key={r.id}
                className={`rounded-2xl border bg-card p-4 sm:p-5 flex gap-4 items-start ${
                  isCurrent ? "border-accent shadow-sm" : "border-border"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center size-10 rounded-xl shrink-0 ${
                    isCurrent
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.icon}
                </span>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold">
                      {r.title}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                        Deine Rolle
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {r.blurb}
                  </p>
                  <span className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wide mt-1">
                    {r.unlock}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/heute"
          className={buttonVariants({ size: "lg" }) + " h-12 flex-1"}
        >
          Heutiges Briefing
        </Link>
        <Link
          href="/profil"
          className={
            buttonVariants({ variant: "outline", size: "lg" }) + " h-12 flex-1"
          }
        >
          <ShieldCheck className="size-4 mr-1.5" />
          Dein Profil
        </Link>
      </div>
    </main>
  );
}
