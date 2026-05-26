"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GooeyFilter } from "@/components/ui/gooey-filter";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/hooks/use-screen-size";
import { getLocalSession, startGuestSession } from "@/lib/local/session";

const HERO_BG_URL = "/hero-reichstag.png";

// Landing — vollflächiges Reichstag-Bild perfekt zentriert (wie früher),
// weißer "Politpuls"-Schriftzug groß auf dem Bild, Pixel-Trail mit Gooey,
// drei iOS-Style CTAs unten.
export default function LandingPage() {
  const router = useRouter();
  const screenSize = useScreenSize();
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const session = getLocalSession();
    if (session) setReturning(true);
  }, []);

  async function continueAsGuest() {
    // Falls eine alte Supabase-Session vorhanden ist: signOut, damit der
    // Server-Cookie nicht zurück zum echten Konto routet.
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => null);
    } catch {
      /* Supabase nicht konfiguriert — egal */
    }
    startGuestSession();
    router.push("/home");
  }

  return (
    <main
      className="relative w-full overflow-hidden flex flex-col items-center text-center"
      style={{
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Reichstag-Painting in voller Pracht, perfekt zentriert auf jedem iPhone */}
      <img
        src={HERO_BG_URL}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dunkler Wash unten fuer CTA-Lesbarkeit. Im Light-Mode deutlich
          schwaecher, damit das helle Tagesbild nicht unten verdunkelt
          wirkt; im Dark-Mode bleibt's tiefer fuer Kontrast. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/30 dark:from-black/10 dark:via-black/15 dark:to-black/55" />

      {/* Gooey Pixel-Trail bleibt — interaktiver Pastell-Vibe */}
      <GooeyFilter id="politpuls-hero-goo" strength={5} />
      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#politpuls-hero-goo)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 22 : 32}
          fadeDuration={0}
          delay={500}
          pixelClassName="bg-white"
        />
      </div>

      {/* Content — zentriert oben/mitte */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-2xl pointer-events-none"
      >
        <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
          Politpuls
        </h1>

        <p className="text-base sm:text-xl text-white/95 max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] mt-5">
          Bundespolitik in drei Minuten am Tag.
        </p>
      </motion.div>

      {/* Sticky Bottom CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-5 pb-6 flex flex-col gap-3"
      >
        {returning ? (
          <Link
            href="/home"
            className="block w-full rounded-full bg-gold text-gold-ink font-bold uppercase tracking-wide text-center py-4 text-base shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            Weiterspielen
          </Link>
        ) : (
          <Link
            href="/onboarding"
            className="block w-full rounded-full bg-gold text-gold-ink font-bold uppercase tracking-wide text-center py-4 text-base shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            Konto erstellen
          </Link>
        )}

        <div className="text-center text-sm text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          Schon ein Konto?{" "}
          <Link
            href="/login"
            className="text-gold font-semibold hover:underline underline-offset-4"
          >
            Anmelden
          </Link>
        </div>

        <button
          type="button"
          onClick={continueAsGuest}
          className="text-center text-sm text-white/85 hover:text-white py-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        >
          Ohne Konto fortfahren
        </button>
      </motion.div>
    </main>
  );
}
