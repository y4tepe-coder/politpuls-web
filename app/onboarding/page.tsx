"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { parties } from "@/lib/spektrum/parties";
import { registerLocally, ensureLocalSession } from "@/lib/local/session";
import { updateLocalState } from "@/lib/local/state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PolitpulsMark } from "@/components/brand/Logo";
import { ArrowRight, ArrowLeft, Mail, User, Sparkles } from "lucide-react";
import Link from "next/link";

// 3-step onboarding flow, iOS-style: name → optional email → party.
// On finish: route to /heute for the first daily mission.

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function next() {
    setStep((s) => Math.min(3, s + 1) as Step);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  async function finish() {
    setSubmitting(true);
    // Local registration first — works without backend.
    ensureLocalSession();
    if (name.trim() || email.trim()) {
      registerLocally(name, email);
    }
    if (partyId) {
      updateLocalState({ party_id: partyId });
    }
    router.push("/heute");
  }

  return (
    <main className="relative flex flex-1 flex-col min-h-screen bg-background overflow-hidden">
      {/* Soft accent background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(250,204,21,0.12),transparent_60%)] pointer-events-none" />

      {/* Progress + back */}
      <header className="relative z-10 mx-auto w-full max-w-md px-5 pt-6 flex items-center justify-between">
        <button
          onClick={step > 0 ? back : () => router.push("/")}
          className="inline-flex items-center justify-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
        <ProgressDots current={step} total={3} />
        <Link
          href="/heute"
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Überspringen
        </Link>
      </header>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepShell key="0">
              <Hero
                kicker="Willkommen"
                title="Wie sollen wir dich nennen?"
                blurb="Nur ein Vorname reicht. Du kannst ihn später ändern."
              />
              <form
                className="flex flex-col gap-3 w-full max-w-sm mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim()) next();
                }}
              >
                <Label htmlFor="name" className="sr-only">
                  Vorname
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="name"
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z. B. Yasin"
                    className="pl-9 h-12 text-base"
                    autoComplete="given-name"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 group"
                  disabled={!name.trim()}
                >
                  Weiter
                  <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </form>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell key="1">
              <Hero
                kicker={`Hallo, ${name.trim() || "du"}`}
                title="Spielstand sichern?"
                blurb="Mit E-Mail kannst du auf anderen Geräten weiterspielen. Optional — du kannst direkt loslegen."
              />
              <form
                className="flex flex-col gap-3 w-full max-w-sm mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <Label htmlFor="email" className="sr-only">
                  E-Mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="du@beispiel.de (optional)"
                    className="pl-9 h-12 text-base"
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 group">
                  Weiter
                  <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    next();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 mt-1"
                >
                  Ohne E-Mail weitermachen
                </button>
              </form>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell key="2">
              <Hero
                kicker="Deine Partei"
                title="Mit welcher Partei willst du antreten?"
                blurb="Das wird deine Heimat im Wahlkampf — du kannst sie später jederzeit ändern."
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 w-full max-w-md mt-2">
                {parties.map((party) => {
                  const isSelected = partyId === party.id;
                  return (
                    <button
                      key={party.id}
                      type="button"
                      onClick={() => setPartyId(party.id)}
                      className={`relative rounded-xl border-2 p-3 flex flex-col gap-1.5 items-start transition-all text-left ${
                        isSelected
                          ? "bg-card shadow-md scale-[1.03]"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                      style={isSelected ? { borderColor: party.color } : undefined}
                    >
                      <span
                        className="size-5 rounded-full"
                        style={{ backgroundColor: party.color }}
                        aria-hidden
                      />
                      <span className="font-serif font-semibold text-sm">
                        {party.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={next}
                size="lg"
                className="h-12 group w-full max-w-sm mt-4"
                disabled={!partyId}
              >
                Weiter
                <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell key="3">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center size-20 rounded-full bg-accent/20"
              >
                <PolitpulsMark className="size-12 text-foreground" />
              </motion.div>
              <Hero
                kicker="Bereit"
                title={`Los geht's, ${name.trim() || "Politprofi"}.`}
                blurb="Deine erste Tagesmission wartet. Ein Briefing, eine Entscheidung, ein Punkt auf dem Kompass."
              />
              <Button
                onClick={finish}
                size="lg"
                className="h-13 px-8 group w-full max-w-sm shadow-md shadow-accent/30"
                disabled={submitting}
              >
                {submitting ? "Starte …" : "Erste Mission starten"}
                <Sparkles className="size-4 ml-2" />
              </Button>
            </StepShell>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 w-full max-w-md text-center"
    >
      {children}
    </motion.div>
  );
}

function Hero({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <header className="flex flex-col gap-2 items-center">
      <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.2em]">
        {kicker}
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm mt-1">
        {blurb}
      </p>
    </header>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total + 1 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current
              ? "w-6 bg-accent"
              : i < current
                ? "w-1.5 bg-foreground/60"
                : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}
