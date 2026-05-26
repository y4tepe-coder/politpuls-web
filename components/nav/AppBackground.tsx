"use client";

// Fixed, full-bleed Reichstag-Painting. <picture> waehlt intern zwischen
// Portrait (Mobile) und Landscape (Desktop ab 1024 px) — der Browser laedt
// nur das passende Bild. Day/Night-Toggle laeuft per CSS-Klasse
// (app-bg-day/night) in globals.css via prefers-color-scheme.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <picture className="app-bg-day absolute inset-0">
        <source media="(min-width: 1024px)" srcSet="/hero-reichstag-landscape.png" />
        <img
          src="/hero-reichstag.png"
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center"
        />
      </picture>
      <picture className="app-bg-night absolute inset-0">
        <source media="(min-width: 1024px)" srcSet="/hero-reichstag-night.png" />
        <img
          src="/hero-reichstag-night.png"
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center"
        />
      </picture>
      <div className="app-bg-wash absolute inset-0" />
    </div>
  );
}
