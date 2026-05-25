"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GooeyFilter } from "@/components/ui/gooey-filter";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useScreenSize } from "@/hooks/use-screen-size";
import { getLocalSession } from "@/lib/local/session";
import { ArrowRight } from "lucide-react";

// Reichstag im impressionistischen Stil — liegt unter web/public/hero-reichstag.png.
// Wenn du ein anderes Bild willst, leg es in web/public/ ab und passe den Pfad an.
const HERO_BG_URL = "/hero-reichstag.png";

// Full-bleed light hero with the Bundestag (or any impressionist painting) behind
// a white pixel-trail that gets glued together by a gooey SVG filter — the user
// drags their cursor and white "clouds" follow.

export default function LandingPage() {
  const screenSize = useScreenSize();
  const [destination, setDestination] = useState("/onboarding");

  useEffect(() => {
    const session = getLocalSession();
    if (session) setDestination("/heute");
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center bg-background">
      {/* Background image — Reichstag / impressionist painting */}
      <img
        src={HERO_BG_URL}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Very gentle wash — the painting is pastel and bright, so we keep
          most of the colour and just lift contrast under the headline. */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Gooey filter def (invisible) */}
      <GooeyFilter id="politpuls-hero-goo" strength={5} />

      {/* Pixel-trail layer with gooey filter applied. Pixels stay 500ms then snap
          out — same recipe as the 21st.dev demo for that "white cloud" feel. */}
      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#politpuls-hero-goo)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 24 : 32}
          fadeDuration={0}
          delay={500}
          pixelClassName="bg-white"
        />
      </div>

      {/* Content layer — sits above the gooey pixels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-3xl pointer-events-none"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm border border-white/60 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
          Das tägliche Politik-Spiel
        </span>

        <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
          Politpuls
        </h1>

        <p className="text-base sm:text-xl text-white/95 max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          Bundespolitik in drei Minuten am Tag. Eine echte Nachricht aus Berlin,
          vier Wege sie zu lösen — du entscheidest.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="pointer-events-auto mt-3 flex flex-col items-center gap-3"
        >
          <MagneticButton distance={0.35}>
            <Link
              href={destination}
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-foreground text-background px-9 py-4 sm:px-12 sm:py-5 text-base sm:text-lg font-semibold shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_24px_70px_-10px_rgba(0,0,0,0.7)] hover:bg-foreground/90 transition-all"
            >
              Politpuls starten
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </MagneticButton>
          <p className="text-[11px] text-white/80 mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            Bewege die Maus über den Hintergrund · Pixel reagieren
          </p>
        </motion.div>
      </motion.div>

      {/* Subtle footer mark */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] drop-shadow-sm">
          Politpuls · Berlin
        </p>
      </div>
    </main>
  );
}
