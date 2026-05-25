"use client";

// Fixed, full-bleed Reichstag-Painting. Per Media-Query swappen wir Tag-
// und Nacht-Bild. Im Light-Mode haelt ein leichter Cream-Wash die Cards
// lesbar; im Dark-Mode lassen wir das Bild voll wirken.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Tag-Bild — Light-Mode default, im Dark-Mode versteckt */}
      <img
        src="/hero-reichstag.png"
        alt=""
        aria-hidden
        className="dark:hidden absolute inset-0 w-full h-full object-cover object-center opacity-70"
      />
      {/* Nacht-Bild — nur Dark-Mode */}
      <img
        src="/hero-reichstag-night.png"
        alt=""
        aria-hidden
        className="hidden dark:block absolute inset-0 w-full h-full object-cover object-center opacity-100"
      />
      {/* Cream-Wash nur im Light-Mode (Dark braucht keinen — Bild ist eh dunkel) */}
      <div className="absolute inset-0 bg-background/30 dark:bg-transparent" />
    </div>
  );
}
