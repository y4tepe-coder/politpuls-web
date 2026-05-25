"use client";

// Fixed, full-bleed background for all in-app pages.
// The Reichstag painting sits very faded behind everything; a pastel gradient
// layer + the same dot grain we already use on the body make the whole app
// feel like one continuous painting — same vibe as the landing hero.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Light: warm Reichstag painting at very low opacity */}
      <picture>
        <source
          srcSet="/hero-reichstag-night.png"
          media="(prefers-color-scheme: dark)"
        />
        <img
          src="/hero-reichstag.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18]"
        />
      </picture>

      {/* Pastel wash on top so cards stay readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/95 to-background" />

      {/* Subtle pixel-dot grain — echoes the gooey landing effect */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.4 0.06 260 / 0.08) 1px, transparent 1.6px)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Pastel accent washes — warm peach top-right, mint bottom-left */}
      <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-pastel-peach opacity-50 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-pastel-mint opacity-50 blur-3xl" />
    </div>
  );
}
