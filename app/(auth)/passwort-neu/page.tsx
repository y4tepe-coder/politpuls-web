"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { germanAuthError } from "@/lib/auth/errors";
import { Lock } from "lucide-react";

// Schritt 2 des Passwort-Resets: Der User landet hier nach Klick auf den
// Recovery-Link (Session wurde über /auth/callback gesetzt). Neues Passwort
// setzen → updateUser → weiter zu /heute.
export default function PasswortNeuPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (password !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(germanAuthError(updateError.message));
        setSubmitting(false);
        return;
      }
      router.push("/heute");
    } catch {
      setError("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-7">
        <header className="flex flex-col gap-3 items-center text-center">
          <Logo size="md" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground mt-2">
            Neues Passwort
          </h1>
          <p className="text-sm text-muted-foreground">
            Wähle ein neues Passwort für dein Konto.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Neues Passwort
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
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
                autoComplete="new-password"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Wiederholen
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Passwort erneut eingeben"
                minLength={6}
                disabled={submitting}
                className="pl-9 h-12"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !password || !confirm}
            size="lg"
            className="h-12 mt-2"
          >
            {submitting ? "Speichern …" : "Passwort speichern"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-center px-4 py-3 rounded-xl text-destructive bg-destructive/10">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
