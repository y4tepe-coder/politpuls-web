"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GooeyFilter } from "@/components/ui/gooey-filter";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/hooks/use-screen-size";
import { getLocalSession, startGuestSession } from "@/lib/local/session";
import { PolitpulsMark } from "@/components/brand/Logo";

const HERO_BG_URL = "/hero-reichstag.png";

// Landing — Reichstag-Hero mit iOS-Welcome-CTAs.
// Drei Wege: Konto erstellen (gold pill primary), Anmelden (link),
// Ohne Konto fortfahren (link, ein-Klick zu /home).
export default function LandingPage() {
  const router = useRouter();
  const screenSize = useScreenSize();
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const session = getLocalSession();
    if (session) setReturning(true);
  }, []);

  function continueAsGuest() {
    startGuestSession();
    router.push("/home");
  }

  return (
    <main className="relative h-screen w-full overflow-hidden flex flex-col bg-ink text-white">
      {/* Reichstag-Painting im Hintergrund — auf Welcome-Page nur dezent. */}
      <img
        src={HERO_BG_URL}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-ink/55" />

      {/* Pixel-Trail-Effekt für den Pastell-Vibe — der User mag das */}
      <GooeyFilter id="politpuls-hero-goo" strength={5} />
      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#politpuls-hero-goo)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 22 : 32}
          fadeDuration={0}
          delay={500}
          pixelClassName="bg-white/70"
        />
      </div>

      {/* Mittelteil: Maskottchen-Mark + Wordmark + Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6"
      >
        <div className="flex flex-col items-center gap-5 max-w-md">
          <div className="size-24 sm:size-28 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
            <PolitpulsMark className="size-14 sm:size-16 text-white" />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-none tracking-tight">
            <span className="text-white">Polit</span>
            <span className="text-gold">puls</span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-sm leading-relaxed">
            Bundespolitik in drei Minuten am Tag.
            <br />
            Speichere deinen Fortschritt sicher.
          </p>
        </div>
      </motion.div>

      {/* Sticky Bottom-Section mit den 3 CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 px-5 pb-8 pt-4 flex flex-col gap-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}
      >
        {returning ? (
          <Link
            href="/home"
            className="block w-full rounded-full bg-gold text-gold-ink font-bold text-center py-4 text-base shadow-[0_8px_24px_-6px] shadow-gold/40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            Weiterspielen
          </Link>
        ) : (
          <Link
            href="/onboarding"
            className="block w-full rounded-full bg-gold text-gold-ink font-bold uppercase tracking-wide text-center py-4 text-base shadow-[0_8px_24px_-6px] shadow-gold/40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            Konto erstellen
          </Link>
        )}

        <div className="text-center text-sm text-white/70">
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
          className="text-center text-sm text-white/80 hover:text-white py-2"
        >
          Ohne Konto fortfahren
        </button>

        <p className="text-[10px] text-white/40 text-center mt-1 leading-relaxed">
          Mit dem Fortfahren akzeptierst du unsere
          <br />
          Nutzungsbedingungen und Datenschutzhinweise.
        </p>
      </motion.div>
    </main>
  );
}
