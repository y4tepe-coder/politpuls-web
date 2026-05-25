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
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
        />
      </picture>
      {/* Soft cream wash on top so the painting feels like a background, not
          a foreground — but light enough that the colors really come through. */}
      <div className="absolute inset-0 bg-background/45" />
    </div>
  );
}
