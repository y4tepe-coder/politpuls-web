"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GooeyFilter } from "@/components/ui/gooey-filter";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useScreenSize } from "@/hooks/use-screen-size";
import { getLocalSession } from "@/lib/local/session";
import { PolitpulsMark } from "@/components/brand/Logo";
import { ArrowRight } from "lucide-react";

// Full-bleed hero. Reichstag painting in impressionist pastels (day version) or
// dark night (system dark-mode), both saved locally in /public/. White pixel
// trail + gooey filter for the interactive "cloud" effect.

export default function LandingPage() {
  const screenSize = useScreenSize();
  const [destination, setDestination] = useState("/onboarding");

  useEffect(() => {
    const session = getLocalSession();
    if (session) setDestination("/heute");
  }, []);

  return (
    <main
      className="relative w-full overflow-hidden flex flex-col items-center justify-center text-center bg-background"
      style={{
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Light/Dark image swap via <picture>. The browser picks the right source
          automatically — no JS detection, no flicker. */}
      <picture className="absolute inset-0 w-full h-full">
        <source
          srcSet="/hero-reichstag-night.png"
          media="(prefers-color-scheme: dark)"
        />
        <img
          src="/hero-reichstag.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
      </picture>

      {/* Gentle wash — keeps the painting's pastel colours visible, lifts contrast
          under the headline. Stronger at the bottom for the CTA area. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/45" />

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-5 sm:gap-6 px-6 max-w-3xl pointer-events-none"
      >
        <div className="inline-flex items-center gap-3 pointer-events-none">
          <PolitpulsMark className="size-10 sm:size-12 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm border border-white/60 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
          Das tägliche Politik-Spiel
        </span>

        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
          Politpuls
        </h1>

        <p className="text-base sm:text-xl text-white/95 max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] px-2">
          Bundespolitik in drei Minuten am Tag. Eine echte Nachricht aus Berlin —
          du entscheidest.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="pointer-events-auto mt-4 flex flex-col items-center gap-3"
        >
          <MagneticButton distance={0.3}>
            <Link
              href={destination}
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-white text-foreground px-9 py-4 sm:px-12 sm:py-5 text-base sm:text-lg font-semibold shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_24px_70px_-10px_rgba(0,0,0,0.7)] hover:bg-white/95 transition-all min-h-[44px]"
            >
              Jetzt spielen
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </MagneticButton>
          <Link
            href="/login"
            className="text-xs sm:text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] min-h-[44px] inline-flex items-center"
          >
            Schon angemeldet? Hier rein
          </Link>
        </motion.div>
      </motion.div>

      <div
        className="absolute left-0 right-0 text-center z-10 pointer-events-none"
        style={{ bottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] drop-shadow-sm">
          Politpuls · Berlin
        </p>
      </div>
    </main>
  );
}
