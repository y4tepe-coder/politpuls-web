"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  getLocalState,
  updateLocalState,
  type WahlkampfPlakat,
} from "@/lib/local/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlakatPreview } from "@/components/wahlkampf/PlakatPreview";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const DEFAULT_PLAKAT: WahlkampfPlakat = {
  slogan: "Zeit für etwas Neues.",
  subline: "Politik, die zuhört.",
  color: "sky",
  layout: "classic",
};

const COLORS: {
  id: WahlkampfPlakat["color"];
  label: string;
  swatch: string;
}[] = [
  { id: "rose", label: "Rosenholz", swatch: "#7a2a35" },
  { id: "sand", label: "Sandgelb", swatch: "#c48a05" },
  { id: "sky", label: "Himmelblau", swatch: "#1b4ea0" },
];

const LAYOUTS: {
  id: WahlkampfPlakat["layout"];
  label: string;
  blurb: string;
}[] = [
  { id: "classic", label: "Klassisch", blurb: "Zentriert, ruhig" },
  { id: "modern", label: "Modern", blurb: "Links, mutig" },
  { id: "bold", label: "Bold", blurb: "Versalien, laut" },
];

export default function PlakatPage() {
  const router = useRouter();
  const [plakat, setPlakat] = useState<WahlkampfPlakat>(DEFAULT_PLAKAT);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [themen, setThemen] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = getLocalState();
    setPlakat(local.campaign_plakat ?? DEFAULT_PLAKAT);
    setPartyId(local.party_id);
    setThemen(local.campaign_themen ?? []);
    setHydrated(true);
  }, []);

  function update<K extends keyof WahlkampfPlakat>(
    key: K,
    value: WahlkampfPlakat[K],
  ) {
    setPlakat((p) => ({ ...p, [key]: value }));
  }

  function save() {
    updateLocalState({ campaign_plakat: plakat });
    router.push("/wahlkampf/tv-triell");
  }

  if (!hydrated) return <div className="flex-1" />;

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
          Schritt 2 von 4 · Plakat
        </span>
        <div className="w-11" />
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-pastel-peach-ink text-[11px] font-semibold uppercase tracking-[0.18em]">
          Wahlplakat
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Dein Plakat klebt jetzt.
        </h1>
        <p className="text-sm text-muted-foreground">
          Slogan, Subline, Farbe, Layout. Du siehst es live links — passt es
          an, bis es sich richtig anfühlt.
        </p>
      </div>

      {/* Preview */}
      <div className="flex justify-center py-4">
        <motion.div
          key={`${plakat.color}-${plakat.layout}`}
          initial={{ scale: 0.96, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <PlakatPreview plakat={plakat} partyId={partyId} themen={themen} />
        </motion.div>
      </div>

      {/* Slogan */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="slogan" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Slogan (max. 40 Zeichen)
        </Label>
        <Input
          id="slogan"
          type="text"
          maxLength={40}
          value={plakat.slogan}
          onChange={(e) => update("slogan", e.target.value)}
          placeholder="Zeit für etwas Neues."
          className="h-12 text-base font-serif"
        />
      </div>

      {/* Subline */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="subline" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Subline (max. 60 Zeichen)
        </Label>
        <Input
          id="subline"
          type="text"
          maxLength={60}
          value={plakat.subline}
          onChange={(e) => update("subline", e.target.value)}
          placeholder="Politik, die zuhört."
          className="h-12 text-base"
        />
      </div>

      {/* Farbe */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Farbe
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {COLORS.map((c) => {
            const isActive = plakat.color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => update("color", c.id)}
                className={`rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all min-h-[80px] ${
                  isActive
                    ? "border-foreground bg-card shadow-md"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <span
                  className="size-8 rounded-full"
                  style={{ backgroundColor: c.swatch }}
                  aria-hidden
                />
                <span className="font-serif font-semibold text-sm">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Layout
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {LAYOUTS.map((l) => {
            const isActive = plakat.layout === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => update("layout", l.id)}
                className={`rounded-xl border-2 p-3 flex flex-col gap-1 text-left transition-all min-h-[80px] ${
                  isActive
                    ? "border-foreground bg-card shadow-md"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <span className="font-serif font-semibold text-sm">
                  {l.label}
                </span>
                <span className="text-xs text-muted-foreground">{l.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={save}
        size="lg"
        className="h-12 mt-4 group sticky bottom-4 shadow-md"
      >
        Plakat fertig — zum TV-Triell
        <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Button>

      {themen.length === 0 && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="size-3.5 text-pastel-mint-ink" />
          Tipp: Im Programm-Schritt gewählte Themen werden hier als Pille auf
          dem Plakat angezeigt.
        </p>
      )}
    </main>
  );
}
