"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WAHLKAMPF_THEMEN,
  MAX_PROGRAMM_THEMEN,
} from "@/lib/data/wahlkampf-themen";
import { getLocalState, updateLocalState } from "@/lib/local/state";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Briefcase,
  Globe,
  GraduationCap,
  HandHelping,
  Home,
  Shield,
  HeartPulse,
  Wifi,
  Train,
  Coins,
  Compass,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import Link from "next/link";

// Wahlkampf-Programm — Step 1 des Wahlkampf-Zyklus.
// Pick 3 von 12 Themen als Wahlversprechen. Pastell-tile-Grid, max 3.

const ICONS = {
  Leaf,
  Briefcase,
  Globe,
  GraduationCap,
  HandHelping,
  Home,
  Shield,
  HeartPulse,
  Wifi,
  Train,
  Coins,
  Compass,
} as const;

const PASTEL_BG = {
  sky: "bg-pastel-sky text-pastel-sky-ink border-pastel-sky-ink/15",
  rose: "bg-pastel-rose text-pastel-rose-ink border-pastel-rose-ink/15",
  mint: "bg-pastel-mint text-pastel-mint-ink border-pastel-mint-ink/15",
  peach: "bg-pastel-peach text-pastel-peach-ink border-pastel-peach-ink/15",
  lavender:
    "bg-pastel-lavender text-pastel-lavender-ink border-pastel-lavender-ink/15",
  sand: "bg-pastel-sand text-pastel-sand-ink border-pastel-sand-ink/15",
} as const;

export default function ProgrammPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = getLocalState();
    setSelected(local.campaign_themen ?? []);
    setHydrated(true);
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= MAX_PROGRAMM_THEMEN) return;
    setSelected([...selected, id]);
  }

  function save() {
    updateLocalState({ campaign_themen: selected });
    router.push("/wahlkampf/plakat");
  }

  if (!hydrated) {
    return <div className="flex-1" />;
  }

  const canContinue = selected.length === MAX_PROGRAMM_THEMEN;

  return (
    <main className="flex flex-1 flex-col max-w-2xl mx-auto w-full px-5 py-6 gap-6">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/wahlkampf"
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zurück zum Wahlkampf"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          Schritt 1 von 4 · Programm
        </span>
        <div className="w-11" />
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-pastel-mint-ink text-[11px] font-semibold uppercase tracking-[0.18em]">
          Wahlversprechen
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Wähle drei Themen.
        </h1>
        <p className="text-sm text-muted-foreground">
          Mit diesen drei Themen ziehst du in den Wahlkampf. Sie tauchen auf
          deinem Plakat auf und prägen, wie das Volk dich wahrnimmt.
        </p>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {selected.length} / {MAX_PROGRAMM_THEMEN} gewählt
      </p>

      <ul className="grid grid-cols-2 gap-2.5">
        {WAHLKAMPF_THEMEN.map((thema) => {
          const Icon = ICONS[thema.icon as keyof typeof ICONS];
          const isSelected = selected.includes(thema.id);
          const disabled =
            !isSelected && selected.length >= MAX_PROGRAMM_THEMEN;
          return (
            <li key={thema.id}>
              <button
                type="button"
                onClick={() => toggle(thema.id)}
                disabled={disabled}
                className={`relative w-full text-left rounded-2xl border-2 p-3.5 flex flex-col gap-2 transition-all min-h-[110px] ${
                  isSelected
                    ? `${PASTEL_BG[thema.pastel]} border-foreground shadow-md`
                    : `${PASTEL_BG[thema.pastel]} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-md"} border-transparent`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center size-8 rounded-lg bg-card/80">
                    {Icon && <Icon className="size-4" />}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-foreground text-background">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-serif font-semibold text-base leading-tight">
                    {thema.label}
                  </span>
                  <span className="text-[11px] leading-snug opacity-80">
                    {thema.blurb}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        onClick={save}
        size="lg"
        className="h-12 mt-2 group sticky bottom-4"
        disabled={!canContinue}
      >
        {canContinue ? "Weiter zum Plakat" : `Wähle noch ${MAX_PROGRAMM_THEMEN - selected.length}`}
        {canContinue && (
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        )}
      </Button>
    </main>
  );
}
