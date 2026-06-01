"use client";

// Fixed, full-bleed Reichstag-Hintergrund. Vier Varianten in /public/hintergrund:
// hell/dunkel × hochkant(Handy)/quer(Laptop ab 1024px). Das <picture> laedt nur
// das passende Bild; der Hell/Dunkel-Wechsel laeuft per CSS-Klasse
// (app-bg-day/night) ueber prefers-color-scheme in globals.css.
// object-cover fuellt immer den ganzen Viewport — am Handy von oben bis unten.

export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <picture className="app-bg-day absolute inset-0">
        <source
          media="(min-width: 1024px)"
          srcSet="/hintergrund/bundestag-hell-quer.png"
        />
        <img
          src="/hintergrund/reichstag-hell-hochkant.png"
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center"
        />
      </picture>
      <picture className="app-bg-night absolute inset-0">
        <source
          media="(min-width: 1024px)"
          srcSet="/hintergrund/bundestag-dunkel-quer.png"
        />
        <img
          src="/hintergrund/reichstag-dunkel-hochkant.png"
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center"
        />
      </picture>
      <div className="app-bg-wash absolute inset-0" />
    </div>
  );
}
