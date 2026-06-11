// Datengetriebene Props: die Pipeline (make-video.mjs) baut eine Szenenliste,
// jede Szene kennt ihre Dauer (aus der Audiolänge berechnet) und optional eine
// Audiodatei (liegt in public/audio/). Ohne Audio läuft die Szene still mit
// einer Default-Dauer — so ist eine Vorschau ohne TTS-Key möglich.

export type Fact = { value: string; label: string };

// Untertitel-Häppchen, wortsynchron. from/to sind LOKALE Frames zur Szene
// (Audio startet bei lokal 0). Werden aus den ElevenLabs-Timestamps gebaut.
export type CaptionChunk = { text: string; from: number; to: number };

type Base = {
  durationInFrames: number;
  audio: string | null;
  captions?: CaptionChunk[];
};

// Gemeinsame Text-Overlays für Medien-Szenen (wenig Text, viel Bild):
type MediaOverlayFields = {
  kicker?: string; // kleine Pille oben
  title?: string; // große Überschrift unten (ersetzt Intro/Outro-Folien)
  keyword?: string; // Lower-Third-Schlagwort
  credit?: string; // Bildnachweis (klein), z. B. "Foto: … / CC BY-SA"
};

export type Scene =
  | (Base & {
      type: "intro";
      kicker: string;
      headline: string;
      deck: string;
    })
  | (Base & { type: "facts"; heading: string; facts: Fact[] })
  // Vollflächiges echtes Foto mit variierter Kamerafahrt + Text-Overlay.
  | (Base & {
      type: "image";
      src: string;
      motion?:
        | "zoomIn"
        | "zoomOut"
        | "panLeft"
        | "panRight"
        | "zoomInPanUp"
        | "zoomInPanLeft";
    } & MediaOverlayFields)
  // Vollflächiger echter Clip (OffthreadVideo) mit Text-Overlay.
  | (Base & { type: "video"; src: string; muted?: boolean } & MediaOverlayFields)
  | (Base & { type: "outro"; streitfrage: string })
  // NotebookLM-/PowerPoint-Stil: Hero-Bild mit Kamera-Push-in oben, darunter
  // Überschrift + animierte Infopunkte. Text steckt IN der Slide (keine
  // separaten Untertitel) → auf jedem Bildschirm sichtbar.
  | (Base & {
      type: "infoslide";
      src: string;
      kicker?: string;
      heading: string;
      points: string[];
      motion?: "zoomIn" | "zoomInPanUp" | "zoomInPanLeft" | "panRight";
    });

export type DossierVideoProps = {
  scenes: Scene[];
};
