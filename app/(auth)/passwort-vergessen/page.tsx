"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { germanAuthError } from "@/lib/auth/errors";
import { Mail } from "lucide-react";

// Schritt 1 des Passwort-Resets: E-Mail eingeben, Supabase schickt einen
// Recovery-Link (über /auth/callback → /passwort-neu). Neutrale Bestätigung,
// damit man nicht herausfinden kann, welche E-Mails registriert sind.
export default function PasswortVergessenPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/passwort-neu`,
        },
      );
      if (resetError) {
        setError(germanAuthError(resetError.message));
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError(germanAuthError("network"));
    }
    setSubmitting(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-7">
        <header className="flex flex-col gap-3 items-center text-center">
          <Logo size="md" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground mt-2">
            Passwort vergessen?
          </h1>
          <p className="text-sm text-muted-foreground">
            Gib deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen.
          </p>
        </header>

        {sent ? (
          <p className="text-sm text-center px-4 py-3 rounded-xl text-foreground bg-success/15 border border-success/30">
            Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link
            zum Zurücksetzen geschickt. Schau in dein Postfach (auch im Spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
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
                  disabled={submitting}
                  className="pl-9 h-12"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !email}
              size="lg"
              className="h-12 mt-2"
            >
              {submitting ? "Wird gesendet …" : "Link senden"}
            </Button>
          </form>
        )}

        {error && (
          <p className="text-sm text-center px-4 py-3 rounded-xl text-destructive bg-destructive/10">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground pt-4 border-t border-foreground/8">
          <Link
            href="/login"
            className="hover:text-foreground underline underline-offset-4 py-1.5"
          >
            Zurück zum Login
          </Link>
        </div>
      </div>
    </main>
  );
}
