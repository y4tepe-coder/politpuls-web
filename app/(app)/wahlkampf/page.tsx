"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { parties } from "@/lib/spektrum/parties";
import { getLocalState, updateLocalState, type LocalRole } from "@/lib/local/state";
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
    title: "Kandidat:in",
    icon: <Flag className="size-5" />,
    blurb:
      "Du startest hier. Jeden Tag eine Entscheidung, jeden Monat eine Wahl — wenn du gut spielst, klettert deine Partei nach oben.",
    unlock: "Aktiv ab Tag 1",
  },
  {
    id: "minister",
    title: "Minister:in",
    icon: <Briefcase className="size-5" />,
    blurb:
      "Wenn deine Partei Platz 2–4 holt und in die Koalition passt, bekommst du ein Ressort. Du verantwortest jetzt ein Themenfeld.",
    unlock: "Nach erfolgreicher Wahl",
  },
  {
    id: "kanzler",
    title: "Bundeskanzler:in",
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

const PASTEL_BG = {
  sky: "bg-pastel-sky text-pastel-sky-ink border-pastel-sky-ink/15",
  rose: "bg-pastel-rose text-pastel-rose-ink border-pastel-rose-ink/15",
  mint: "bg-pastel-mint text-pastel-mint-ink border-pastel-mint-ink/15",
  peach: "bg-pastel-peach text-pastel-peach-ink border-pastel-peach-ink/15",
} as const;

export default function WahlkampfPage() {
  const [role, setRole] = useState<LocalRole>("kandidat");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const local = getLocalState();
    setRole(local.role);
    setPartyId(local.party_id);
    setStreak(local.current_streak);
    setHydrated(true);
  }, []);

  function handleSelectParty(pid: string) {
    setPartyId(pid);
    updateLocalState({ party_id: pid });
  }

  const daysUntilCampaign = Math.max(0, 14 - streak);
  const selectedParty = partyId
    ? parties.find((p) => p.id === partyId)
    : null;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
          Wahlkampf-Modus
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Werde Bundeskanzler:in.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Alle 30 Tage wird gewählt. Bis dahin sammelst du im täglichen Briefing
          Profil — und am Wahltag entscheidet sich, ob du regierst, mitregierst
          oder opponierst.
        </p>
      </header>

      {/* Status banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/20 p-5 sm:p-6 flex items-start gap-4 shadow-sm">
        <span className="inline-flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 shrink-0">
          <CalendarDays className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                className={`relative rounded-xl border-2 p-3 flex flex-col gap-1 items-start transition-all text-left ${
                  isSelected
                    ? "border-foreground bg-card shadow-md"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
                style={
                  isSelected
                    ? { borderColor: party.color }
                    : undefined
                }
              >
                <span
                  className="size-5 rounded-full shrink-0"
                  style={{ backgroundColor: party.color }}
                  aria-hidden
                />
                <span className="font-serif font-semibold text-sm">
                  {party.shortName}
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 inline-flex items-center justify-center size-5 rounded-full bg-success text-success-foreground">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={4}
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedParty && (
          <p className="text-xs text-muted-foreground mt-1">
            Du trittst als <span className="font-medium text-foreground">{selectedParty.name}</span> an.
          </p>
        )}
      </section>

      {/* Roles */}
      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                      <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Deine Rolle
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {r.blurb}
                  </p>
                  <span className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wide mt-1">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                className={`group rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-md min-h-[64px] ${PASTEL_BG[phase.pastel]}`}
              >
                <span className="font-mono text-xs tabular-nums w-16 shrink-0 opacity-80">
                  {phase.days}
                </span>
                <span className="font-serif text-base font-semibold flex-1">
                  {phase.title}
                </span>
                <ChevronRight className="size-5 shrink-0 group-hover:translate-x-0.5 transition-transform opacity-70" />
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
