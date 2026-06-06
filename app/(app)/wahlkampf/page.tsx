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
  CalendarDays,
  Flag,
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

const PHASES: {
  id: string;
  title: string;
  days: string;
  href: string;
  pastel: "sky" | "rose" | "mint" | "peach";
}[] = [
  { id: "programm", title: "Wahlprogramm schreiben", days: "Schritt 1", href: "/wahlkampf/programm", pastel: "mint" },
  { id: "plakat", title: "Plakat gestalten", days: "Schritt 2", href: "/wahlkampf/plakat", pastel: "peach" },
  { id: "tv-triell", title: "TV-Triell führen", days: "Schritt 3", href: "/wahlkampf/tv-triell", pastel: "sky" },
  { id: "wahl", title: "Wahlsonntag", days: "Schritt 4", href: "/wahlkampf/wahl", pastel: "rose" },
];

// In iOS-glass we use one neutral look for all phases — the number tells
// you the order, not the color.
const PHASE_CARD =
  "glass-card text-foreground hover:bg-foreground/5";

export default function WahlkampfPage() {
  const [role, setRole] = useState<LocalRole>("kandidat");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState<string>(CUSTOM_PARTY_COLORS[0]);
  const [hydrated, setHydrated] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const local = getLocalState();
    setRole(local.role);
    setPartyId(local.party_id);
    if (local.custom_party) {
      setCustomName(local.custom_party.name);
      setCustomColor(local.custom_party.color);
    }
    setStreak(local.current_streak);
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

  const daysUntilCampaign = Math.max(0, 14 - streak);
  const selectedParty = partyId ? getPartyById(partyId) : null;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
          Wahlkampf-Modus
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Werde Bundeskanzler.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Alle 30 Tage wird gewählt. Bis dahin sammelst du im täglichen Briefing
          Profil — und am Wahltag entscheidet sich, ob du regierst, mitregierst
          oder opponierst.
        </p>
      </header>

      {/* Status banner */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 flex items-start gap-4">
        <span className="inline-flex items-center justify-center size-12 rounded-xl bg-foreground text-background shrink-0">
          <CalendarDays className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            Dein Status
          </span>
          <h2 className="font-serif text-lg sm:text-xl font-semibold leading-snug">
            {hydrated && daysUntilCampaign === 0
              ? "Du bist bereit für den Wahlkampf!"
              : `Wahlkampf öffnet sich in ${daysUntilCampaign} ${daysUntilCampaign === 1 ? "Tag" : "Tagen"}.`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hydrated && daysUntilCampaign === 0
              ? "Wähle deine Partei und starte deinen ersten Zyklus."
              : "Spiele 14 Tage lang das tägliche Briefing — danach öffnet sich dein erster Wahlkampf-Zyklus."}
          </p>
        </div>
      </div>

      {/* Party selection */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Wähle deine Partei
          </h2>
          <p className="text-sm text-muted-foreground">
            Mit welcher Partei willst du antreten? Du kannst später wechseln.
          </p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

          {/* Eigene Partei */}
          <button
            type="button"
            onClick={selectCustomParty}
            className={`relative rounded-xl border border-dashed p-3 flex items-center justify-center min-h-[56px] transition-all text-center ${
              isCustom
                ? "bg-card shadow-sm scale-[1.02]"
                : "border-foreground/25 hover:bg-foreground/5"
            }`}
            style={
              isCustom
                ? { borderColor: customColor, borderStyle: "solid", boxShadow: `0 0 0 1px ${customColor}` }
                : undefined
            }
          >
            <span className="font-serif font-semibold text-sm">Eigene</span>
          </button>
        </div>

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

        {selectedParty && selectedParty.name.trim() && (
          <p className="text-xs text-muted-foreground mt-1">
            Du trittst als <span className="font-medium text-foreground">{selectedParty.name}</span> an.
          </p>
        )}
      </section>

      {/* Roles */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
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

      {/* Campaign phases — anklickbare Schritte */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Der Wahlkampf-Zyklus
          </h2>
          <p className="text-sm text-muted-foreground">
            Vier Schritte bis zur Wahl. Du kannst jederzeit reinschnuppern.
          </p>
        </header>
        <ol className="flex flex-col gap-2.5">
          {PHASES.map((phase) => (
            <li key={phase.id}>
              <Link
                href={phase.href}
                className={`group ${PHASE_CARD} rounded-xl p-4 flex items-center gap-4 transition-all min-h-[64px]`}
              >
                <span className="font-mono text-xs tabular-nums w-16 shrink-0 text-muted-foreground">
                  {phase.days}
                </span>
                <span className="font-serif text-base font-semibold flex-1">
                  {phase.title}
                </span>
                <ChevronRight className="size-5 shrink-0 group-hover:translate-x-0.5 transition-transform text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ol>
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
