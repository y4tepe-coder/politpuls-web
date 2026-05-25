"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { Mail, CheckCircle2 } from "lucide-react";

// Login = magic link only. Kein Passwort, kein Google, kein Apple.
// Gast-Modus läuft separat über /onboarding (wenn jemand das explizit will,
// kann er da hin — wir verstecken den Button hier nicht hart, aber er steht
// klein im Footer, nicht als Haupt-CTA).
export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/heute";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
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

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-7">
        <header className="flex flex-col gap-3 items-center text-center">
          <Logo size="md" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground mt-2">
            Anmelden
          </h1>
          <p className="text-sm text-muted-foreground">
            Gib deine E-Mail ein. Wir schicken dir einen Login-Link — kein
            Passwort, kein Google, kein Apple.
          </p>
        </header>

        {status !== "sent" && (
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
                disabled={status === "sending"}
                className="pl-9 h-12"
                autoComplete="email"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={status === "sending" || !email}
              size="lg"
              className="h-12 mt-1"
            >
              {status === "sending" ? "Sende Link …" : "Magic Link senden"}
            </Button>
          </form>
        )}

        {status === "sent" && message && (
          <div className="rounded-2xl border border-pastel-mint-ink/15 bg-pastel-mint text-pastel-mint-ink p-5 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="size-8" />
            <p className="text-sm leading-relaxed">{message}</p>
            <p className="text-xs opacity-80 mt-1">
              Du kannst diesen Tab schließen, der Link öffnet einen neuen.
            </p>
          </div>
        )}

        {message && status === "error" && (
          <p className="text-sm text-center px-4 py-3 rounded-lg text-destructive bg-destructive/10">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground pt-4 border-t border-border">
          <Link
            href="/onboarding"
            className="hover:text-foreground underline underline-offset-4 py-1.5"
          >
            Noch kein Konto? Hier starten
          </Link>
          <Link
            href="/"
            className="hover:text-foreground underline underline-offset-4 py-1.5"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
