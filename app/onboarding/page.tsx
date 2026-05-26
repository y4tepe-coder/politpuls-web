"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { parties } from "@/lib/spektrum/parties";
import { registerLocally, ensureLocalSession } from "@/lib/local/session";
import { updateLocalState } from "@/lib/local/state";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  User,
  Lock,
  PartyPopper,
  Sparkles,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

// 4-Step Onboarding:
//   0: Wahl — Konto erstellen ODER Als Gast spielen
//   1: Konto-Form ODER Name-Form (je nach Wahl)
//   2: Partei wählen
//   3: Bereit → /home

type Step = 0 | 1 | 2 | 3;
type Mode = null | "account" | "guest";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [mode, setMode] = useState<Mode>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function back() {
    if (step === 0) {
      router.push("/");
      return;
    }
    if (step === 1) {
      setMode(null);
      setStep(0);
      return;
    }
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  async function handleAccountSignUp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }
    } catch {
      // Backend nicht erreichbar — lokal weiter
    }
    ensureLocalSession();
    registerLocally(name, email);
    setSubmitting(false);
    setStep(2);
  }

  function handleGuestSubmit(event: React.FormEvent) {
    event.preventDefault();
    ensureLocalSession();
    registerLocally(name, "");
    setStep(2);
  }

  async function finish() {
    setSubmitting(true);
    if (partyId) updateLocalState({ party_id: partyId });
    router.push("/home");
  }

  return (
    <main className="relative flex flex-1 flex-col min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto w-full max-w-md px-5 pt-6 flex items-center justify-between">
        <button
          onClick={back}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
        <ProgressDots current={step} total={3} />
        <div className="w-11" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepShell key="0">
              <Logo size="lg" textOnly href="/" />
              <Hero
                kicker="Willkommen"
                title="Wie möchtest du starten?"
                blurb="Mit Konto läuft dein Spielstand auf allen Geräten. Als Gast bleibt er auf diesem Browser."
              />

              <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("account");
                    setStep(1);
                  }}
                  className="glass-card group rounded-2xl p-5 flex items-center gap-4 hover:bg-foreground/5 transition-all text-left"
                >
                  <span className="inline-flex items-center justify-center size-11 rounded-xl bg-foreground text-background shrink-0">
                    <UserPlus className="size-5" />
                  </span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="font-serif font-semibold text-lg leading-tight">
                      Konto erstellen
                    </span>
                    <span className="text-xs leading-snug text-foreground/70">
                      E-Mail + Passwort + Name. Spielstand syncs.
                    </span>
                  </span>
                  <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("guest");
                    setStep(1);
                  }}
                  className="glass-card group rounded-2xl p-5 flex items-center gap-4 hover:bg-foreground/5 transition-all text-left"
                >
                  <span className="inline-flex items-center justify-center size-11 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground shrink-0">
                    <ShieldCheck className="size-5" />
                  </span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="font-serif font-semibold text-lg leading-tight">
                      Als Gast spielen
                    </span>
                    <span className="text-xs leading-snug text-foreground/70">
                      Sofort loslegen, läuft auf diesem Gerät.
                    </span>
                  </span>
                  <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform text-muted-foreground" />
                </button>
              </div>

              <Link
                href="/login"
                className="text-on-bg text-sm text-foreground/85 hover:text-foreground underline underline-offset-4 mt-4 font-medium"
              >
                Schon ein Konto? Hier einloggen
              </Link>
            </StepShell>
          )}

          {step === 1 && mode === "account" && (
            <StepShell key="1-account">
              <Hero
                kicker="Schritt 1 von 3"
                title="Konto erstellen"
                blurb="Du kannst dich später auf jedem Gerät einloggen."
              />
              <form
                className="flex flex-col gap-3 w-full max-w-sm mt-2"
                onSubmit={handleAccountSignUp}
              >
                <Label htmlFor="email" className="sr-only">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-Mail"
                    className="pl-9 h-12 text-base"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>

                <Label htmlFor="password" className="sr-only">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort (min. 6 Zeichen)"
                    className="pl-9 h-12 text-base"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>

                <Label htmlFor="name" className="sr-only">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wie sollen wir dich nennen?"
                    className="pl-9 h-12 text-base"
                    autoComplete="given-name"
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 mt-1 group"
                  disabled={submitting || !email || !password || !name.trim()}
                >
                  {submitting ? "Konto erstellen …" : "Konto erstellen"}
                  <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>

                {error && (
                  <p className="text-xs text-destructive text-center mt-1">{error}</p>
                )}
              </form>
            </StepShell>
          )}

          {step === 1 && mode === "guest" && (
            <StepShell key="1-guest">
              <Hero
                kicker="Schritt 1 von 3"
                title="Wie sollen wir dich nennen?"
                blurb="Nur ein Vorname reicht. Du kannst später jederzeit ein Konto erstellen, um den Spielstand zu sichern."
              />
              <form
                className="flex flex-col gap-3 w-full max-w-sm mt-2"
                onSubmit={handleGuestSubmit}
              >
                <Label htmlFor="guest-name" className="sr-only">Vorname</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="guest-name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z. B. Yasin"
                    className="pl-9 h-12 text-base"
                    autoComplete="given-name"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 group" disabled={!name.trim()}>
                  Weiter
                  <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </form>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell key="2">
              <Hero
                kicker="Schritt 2 von 3"
                title="Mit welcher Partei trittst du an?"
                blurb="Deine Heimat im Wahlkampf — kannst du später wechseln."
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 w-full max-w-md mt-2">
                {parties.map((party) => {
                  const isSelected = partyId === party.id;
                  return (
                    <button
                      key={party.id}
                      type="button"
                      onClick={() => setPartyId(party.id)}
                      className={`relative rounded-2xl p-3 flex flex-col gap-1.5 items-start transition-all text-left min-h-[80px] ${
                        isSelected
                          ? "bg-foreground text-background border border-foreground shadow-md scale-[1.03]"
                          : "glass-card hover:bg-foreground/5"
                      }`}
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
                onClick={() => setStep(3)}
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
                className="glass-card inline-flex items-center justify-center size-20 rounded-full"
              >
                <PartyPopper className="size-10 text-foreground" />
              </motion.div>
              <Hero
                kicker="Schritt 3 von 3"
                title={`Los geht's, ${name.trim() || "Politprofi"}.`}
                blurb="Deine erste Tagesmission wartet. Ein Briefing, eine Entscheidung, ein Punkt auf dem Kompass."
              />
              <Button
                onClick={finish}
                size="lg"
                className="h-12 px-8 group w-full max-w-sm shadow-md"
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

function Hero({ kicker, title, blurb }: { kicker: string; title: string; blurb: string }) {
  return (
    <header className="flex flex-col gap-2 items-center">
      <span className="text-on-bg text-foreground/70 text-[11px] font-semibold uppercase tracking-[0.2em]">
        {kicker}
      </span>
      <h1 className="text-on-bg font-serif text-3xl sm:text-4xl font-semibold leading-tight">
        {title}
      </h1>
      <p className="text-on-bg text-sm sm:text-base text-foreground/80 leading-relaxed max-w-sm mt-1">
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
              ? "w-6 bg-foreground"
              : i < current
                ? "w-1.5 bg-foreground/40"
                : "w-1.5 bg-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}
