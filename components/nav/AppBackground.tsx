"use client";

// Fixed, full-bleed background for all in-app pages.
// Reichstag painting at very low opacity — same canvas as the landing hero,
// but quiet enough that frosted-glass cards on top read cleanly. No pastel
// orbs, no dots — clean iOS feel.

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
          className="absolute inset-0 w-full h-full object-cover opacity-[0.14]"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background/90" />
    </div>
  );
}
