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
import { PolitpulsMark } from "@/components/brand/Logo";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";

// 4-step onboarding flow, iOS-style:
//   0: auth-gate (Magic Link OR as guest)
//   1: name
//   2: party
//   3: ready → /heute

type Step = 0 | 1 | 2 | 3;
type AuthMode = null | "magic" | "guest";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function next() {
    setStep((s) => Math.min(3, s + 1) as Step);
  }
  function back() {
    if (step === 0) {
      router.push("/");
      return;
    }
    if (step === 1 && authMode === "guest") {
      setAuthMode(null);
      setStep(0);
      return;
    }
    if (step === 1 && authMode === "magic") {
      setMagicSent(false);
      setStep(0);
      setAuthMode(null);
      return;
    }
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  async function sendMagicLink() {
    if (!email.trim()) return;
    setSubmitting(true);
    setMagicError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/heute`,
        },
      });
      if (error) {
        setMagicError(error.message);
        setSubmitting(false);
        return;
      }
      setMagicSent(true);
    } catch (err) {
      setMagicError(
        err instanceof Error
          ? err.message
          : "Konnte Link nicht senden — versuch es als Gast.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function finish() {
    setSubmitting(true);
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,oklch(0.92_0.07_50/0.55),transparent_60%)] pointer-events-none" />

      <header className="relative z-10 mx-auto w-full max-w-md px-5 pt-6 flex items-center justify-between">
        <button
          onClick={back}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="size-5" />
        </button>
        <ProgressDots current={step} total={3} />
        <Link
          href="/heute"
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline min-h-[44px] inline-flex items-center"
        >
          Überspringen
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepShell key="0">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-pastel-sky">
                <PolitpulsMark className="size-9 text-pastel-sky-ink" />
              </div>
              <Hero
                kicker="Willkommen"
                title="Wie möchtest du starten?"
                blurb="Mit Anmeldung läuft dein Spielstand auf allen Geräten. Als Gast bleibt er auf diesem Browser."
              />

              {authMode === null && (
                <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("magic")}
                    className="group rounded-2xl border-2 border-pastel-mint-ink/15 bg-pastel-mint text-pastel-mint-ink p-5 flex items-center gap-4 hover:shadow-md transition-all text-left"
                  >
                    <span className="inline-flex items-center justify-center size-11 rounded-xl bg-pastel-mint-ink text-pastel-mint shrink-0">
                      <Mail className="size-5" />
                    </span>
                    <span className="flex flex-col flex-1 min-w-0">
                      <span className="font-serif font-semibold text-lg leading-tight">
                        Mit E-Mail anmelden
                      </span>
                      <span className="text-xs leading-snug opacity-80">
                        Magic Link — kein Passwort. Spielstand syncs.
                      </span>
                    </span>
                    <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("guest");
                      next();
                    }}
                    className="group rounded-2xl border-2 border-pastel-peach-ink/15 bg-pastel-peach text-pastel-peach-ink p-5 flex items-center gap-4 hover:shadow-md transition-all text-left"
                  >
                    <span className="inline-flex items-center justify-center size-11 rounded-xl bg-pastel-peach-ink text-pastel-peach shrink-0">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="flex flex-col flex-1 min-w-0">
                      <span className="font-serif font-semibold text-lg leading-tight">
                        Als Gast spielen
                      </span>
                      <span className="text-xs leading-snug opacity-80">
                        Sofort loslegen, läuft auf diesem Gerät.
                      </span>
                    </span>
                    <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}

              {authMode === "magic" && !magicSent && (
                <form
                  className="flex flex-col gap-3 w-full max-w-sm mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMagicLink();
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
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="du@beispiel.de"
                      className="pl-9 h-12 text-base"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 group"
                    disabled={submitting || !email.trim()}
                  >
                    {submitting ? "Sende Link …" : "Magic Link senden"}
                    <Mail className="size-4 ml-1" />
                  </Button>
                  {magicError && (
                    <p className="text-xs text-destructive text-center">
                      {magicError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(null);
                      setEmail("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 mt-1"
                  >
                    Anders entscheiden
                  </button>
                </form>
              )}

              {authMode === "magic" && magicSent && (
                <div className="flex flex-col gap-3 w-full max-w-sm mt-2 text-center">
                  <div className="rounded-2xl border border-pastel-mint-ink/15 bg-pastel-mint text-pastel-mint-ink p-5 flex flex-col items-center gap-2">
                    <Sparkles className="size-6" />
                    <p className="text-sm leading-snug">
                      Link an <span className="font-semibold">{email}</span> gesendet. Öffne ihn, um dich anzumelden.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 group"
                    onClick={() => {
                      next();
                    }}
                  >
                    Während du wartest, weiter spielen
                    <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              )}
            </StepShell>
          )}

          {step === 1 && (
            <StepShell key="1">
              <Hero
                kicker="Schritt 1 von 3"
                title="Wie sollen wir dich nennen?"
                blurb="Nur ein Vorname reicht — du kannst ihn später ändern."
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

          {step === 2 && (
            <StepShell key="2">
              <Hero
                kicker="Schritt 2 von 3"
                title="Mit welcher Partei trittst du an?"
                blurb="Das wird deine Heimat im Wahlkampf — kannst du später wechseln."
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 w-full max-w-md mt-2">
                {parties.map((party) => {
                  const isSelected = partyId === party.id;
                  return (
                    <button
                      key={party.id}
                      type="button"
                      onClick={() => setPartyId(party.id)}
                      className={`relative rounded-xl border-2 p-3 flex flex-col gap-1.5 items-start transition-all text-left min-h-[80px] ${
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
                className="inline-flex items-center justify-center size-20 rounded-full bg-pastel-mint"
              >
                <PartyPopper className="size-10 text-pastel-mint-ink" />
              </motion.div>
              <Hero
                kicker="Schritt 3 von 3"
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
      <span className="text-pastel-peach-ink text-[11px] font-semibold uppercase tracking-[0.2em]">
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
