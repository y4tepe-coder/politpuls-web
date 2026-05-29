"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { germanAuthError } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { Mail, Lock } from "lucide-react";

// Klassisch: Email + Passwort. Kein Magic Link, kein Google, kein Apple.
// Brauche im Supabase-Dashboard: Auth → Settings → "Confirm email" off.
// useSearchParams braucht eine Suspense-Boundary für static rendering.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex flex-1" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/heute";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(germanAuthError(signInError.message));
      setSubmitting(false);
      return;
    }
    router.push(redirectTo);
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
            Mit deiner E-Mail und deinem Passwort.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-Mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Passwort
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                minLength={6}
                disabled={submitting}
                className="pl-9 h-12"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !email || !password}
            size="lg"
            className="h-12 mt-2"
          >
            {submitting ? "Anmelden …" : "Anmelden"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-center px-4 py-3 rounded-xl text-destructive bg-destructive/10">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground pt-4 border-t border-foreground/8">
          <Link href="/passwort-vergessen" className="hover:text-foreground underline underline-offset-4 py-1.5">
            Passwort vergessen?
          </Link>
          <Link href="/onboarding" className="hover:text-foreground underline underline-offset-4 py-1.5">
            Noch kein Konto? Hier registrieren
          </Link>
          <Link href="/" className="hover:text-foreground underline underline-offset-4 py-1.5">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
