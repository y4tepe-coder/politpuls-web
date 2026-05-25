"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerLocally } from "@/lib/local/session";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { Mail, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [supabaseSent, setSupabaseSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setMessage(null);

    // Always save locally first so the user has a working profile immediately.
    registerLocally(name, email);

    // If Supabase is configured, ALSO trigger the magic link so the user can
    // claim the email-based account on the next device.
    if (email.trim() && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/heute`,
          },
        });
        if (!error) {
          setSupabaseSent(true);
          setMessage(
            `Du kannst direkt loslegen. Wir haben dir zusätzlich einen Link an ${email} geschickt — öffne ihn auf jedem Gerät, um deinen Spielstand zu synchronisieren.`,
          );
          setSubmitting(false);
          return;
        }
      } catch {
        // Supabase down — local registration is still fine.
      }
    }

    setMessage(
      `Willkommen, ${name.trim()}! Dein Spielstand läuft jetzt auf diesem Browser.`,
    );
    setTimeout(() => router.push("/heute"), 800);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col gap-7">
        <header className="flex flex-col gap-3 items-center text-center">
          <Logo size="md" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-foreground mt-2">
            Konto erstellen
          </h1>
          <p className="text-sm text-muted-foreground">
            Wähle einen Namen und (optional) eine E-Mail. Du kannst direkt
            loslegen — die E-Mail brauchen wir später, falls du auf einem
            anderen Gerät weiterspielen willst.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Wie sollen wir dich nennen?
            </Label>
            <div className="relative mt-2">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Yasin"
                className="pl-9 h-11"
                autoComplete="given-name"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              E-Mail (optional)
            </Label>
            <div className="relative mt-2">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                className="pl-9 h-11"
                autoComplete="email"
                disabled={submitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-11 mt-2 group"
            disabled={submitting || !name.trim() || supabaseSent}
          >
            {submitting ? "Speichere …" : "Loslegen"}
            <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </form>

        {message && (
          <p className="text-sm text-center px-4 py-3 rounded-lg text-success-foreground bg-success/15 border border-success/30">
            {message}
          </p>
        )}

        <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-foreground underline underline-offset-4"
          >
            Schon ein Konto? Hier einloggen
          </Link>
          <Link
            href="/heute"
            className="hover:text-foreground underline underline-offset-4"
          >
            Erst mal nur reinschauen
          </Link>
        </div>
      </div>
    </main>
  );
}
