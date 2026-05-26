"use client";

// Fixed, full-bleed Reichstag-Painting. Tag-Bild im Light-Mode, Nacht-Bild
// im Dark-Mode. Wir nutzen reine CSS-Klassen (definiert in globals.css per
// @media prefers-color-scheme), statt der Tailwind dark:-Variant —
// damit es garantiert greift, ohne von der Tailwind-Config abzuhaengen.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Bilder im 9:16-Portrait → object-cover fuellt den ganzen Screen.
          Leichter horizontaler Crop (~10%), das Hauptmotiv bleibt mittig. */}
      <img
        src="/hero-reichstag.png"
        alt=""
        aria-hidden
        className="app-bg-day absolute inset-0 w-full h-full object-cover object-center"
      />
      <img
        src="/hero-reichstag-night.png"
        alt=""
        aria-hidden
        className="app-bg-night absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Cream-Wash nur im Light-Mode (Dark-Bild wirkt allein) */}
      <div className="app-bg-wash absolute inset-0" />
    </div>
  );
}
