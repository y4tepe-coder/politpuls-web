// Politpuls-Palette fürs Video — abgeleitet aus den App-Tokens (web/app/globals.css):
// background oklch(.985 .006 85), foreground oklch(.18 .025 260),
// primary oklch(.34 .13 255), accent oklch(.78 .155 65), success oklch(.72 .155 145).
// Hier als Hex-Näherung, damit es überall (auch im Headless-Chromium) sicher rendert.
export const theme = {
  bg: "#FAF8F2", // warmes Papier
  bgAlt: "#F0ECDF",
  ink: "#1B1D2B", // foreground (dunkles Tintenblau)
  inkDim: "#5B6170",
  inkMute: "#8A8F9C",
  primary: "#26408B", // tiefes Blau (Buttons, Akzentflächen)
  primarySoft: "#E7ECF8",
  accent: "#E89A3D", // Bernstein (Glossar-/Highlight-Ton der App)
  accentSoft: "#FBEAD2",
  success: "#3CA06A",
  card: "#FFFFFF",
  border: "rgba(27, 29, 43, 0.12)",
  fontSerif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
  fontSans:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};
