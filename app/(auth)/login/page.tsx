"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureLocalSession } from "@/lib/local/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/heute";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error" | "no-backend"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [anonLoading, setAnonLoading] = useState(false);

  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function handleMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!supabaseConfigured) {
      setStatus("no-backend");
      setMessage(
        "E-Mail-Login ist noch nicht aktiv. Bis das Backend live ist, kannst du dich direkt registrieren oder anonym weiterspielen.",
      );
      return;
    }

    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage(
      `Wir haben dir einen Link an ${email} geschickt. Öffne ihn, um dich anzumelden.`,
    );
  }

  async function handleAnon() {
    setAnonLoading(true);
    try {
      // Always create a local session so the user can immediately play and
      // persist progress on this device — even if Supabase isn't live.
      ensureLocalSession();
      router.push(redirectTo);
    } finally {
      setAnonLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-7">
        <header className="flex flex-col gap-3 items-center text-center">
          <Logo size="md" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground mt-2">
            Willkommen zurück
          </h1>
          <p className="text-sm text-muted-foreground">
            Gib deine E-Mail ein und du bekommst einen Login-Link. Kein
            Passwort, keine Bestätigungs-Schleife.
          </p>
        </header>

        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <Label htmlFor="email" className="text-sm font-medium">
            E-Mail
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              disabled={status === "sending" || status === "sent"}
              className="pl-9 h-11"
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "sending" || status === "sent" || !email}
            size="lg"
            className="h-11 mt-1"
          >
            {status === "sending"
              ? "Sende Link …"
              : status === "sent"
                ? "Link gesendet ✓"
                : "Magic Link senden"}
          </Button>
        </form>

        {message && (
          <p
            className={`text-sm text-center px-4 py-3 rounded-lg ${
              status === "error"
                ? "text-destructive bg-destructive/10"
                : status === "no-backend"
                  ? "text-warning-foreground bg-warning/20 border border-warning/30"
                  : "text-success-foreground bg-success/15 border border-success/30"
            }`}
          >
            {message}
          </p>
        )}

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-background px-3 relative z-10">oder</span>
          <span className="absolute inset-x-0 top-1/2 h-px bg-border -z-0" />
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/registrieren`}
            className="inline-flex items-center justify-center h-11 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium group"
          >
            Neu hier? Konto erstellen
            <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Button
            variant="outline"
            onClick={handleAnon}
            disabled={anonLoading}
            size="lg"
            className="h-11"
          >
            {anonLoading ? "Starte …" : "Ohne Anmeldung loslegen"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Spielstand bleibt auf diesem Gerät, bis du dich anmeldest.
          </p>
        </div>

        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 text-center mt-2"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
