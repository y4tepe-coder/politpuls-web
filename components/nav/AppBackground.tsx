"use client";

// Fixed, full-bleed background for the whole app — same Reichstag painting
// as the landing hero, kept clearly visible so the app feels like one
// continuous canvas. Glass cards on top (.glass-card) carry their own
// backdrop-blur so text stays readable.

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
          className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.12]"
        />
      </picture>
      {/* Strong cream wash — keeps the background feeling like clean paper
          with just a hint of the painting. Cards stay crisp and white. */}
      <div className="absolute inset-0 bg-background/80" />
    </div>
  );
}
