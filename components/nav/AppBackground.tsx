"use client";

// Fixed, full-bleed background — Reichstag-Painting deutlich sichtbar,
// <picture> swappt automatisch zwischen Tag- und Nacht-Version je nach
// System-Dark-Mode. Glass-Cards mit backdrop-blur halten den Vordergrund
// lesbar.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <picture>
        <source
          srcSet="/hero-reichstag-night.png"
          media="(prefers-color-scheme: dark)"
        />
        <img
          src="/hero-reichstag.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 dark:opacity-70"
        />
      </picture>
      {/* Sanfter Wash — leicht genug damit das Bild durchscheint, dicht
          genug damit Text auf glass-cards lesbar bleibt. */}
      <div className="absolute inset-0 bg-background/35" />
    </div>
  );
}
