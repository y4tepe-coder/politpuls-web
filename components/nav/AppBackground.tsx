"use client";

// Fixed, full-bleed background for all in-app pages.
// Same Reichstag painting as the landing hero, kept noticeably more visible
// here than before (35 % opacity) — the user wanted the in-app screens to
// feel like part of the same canvas, with the painting's pastel colors
// peeking through. Cards on top use .glass-card with backdrop-blur, so they
// stay readable regardless.

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
          className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.32]"
        />
      </picture>
      {/* Soft wash so glass cards stay legible. Stronger at the top
          (header area) and bottom (CTA area), lighter through the middle
          where the painting's most colorful part sits. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/65 via-background/50 to-background/80" />
    </div>
  );
}
