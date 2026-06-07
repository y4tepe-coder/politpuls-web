import type { DossierVideoProps } from "./types";

// Stille Default-Vorschau (ohne Audio), damit `npm run dev` sofort etwas zeigt —
// inhaltlich das Seed-Dossier der App. Die echte Pipeline überschreibt das per
// --props mit den Szenen + Audiodauern des Tages-Dossiers.
export const defaultProps: DossierVideoProps = {
  scenes: [
    {
      type: "intro",
      durationInFrames: 150,
      audio: null,
      kicker: "Bundeshaushalt 2027",
      headline: "Mehr Geld für die Bundeswehr — oder für den Klimaschutz?",
      deck: "Die Koalition streitet, wohin im nächsten Haushalt das frische Geld geht. Eine Entscheidung muss noch dieses Jahr fallen.",
    },
    {
      type: "facts",
      durationInFrames: 220,
      audio: null,
      heading: "Drei Zahlen, die alles erklären",
      facts: [
        { value: "+11 %", label: "Steigerung des Verteidigungsetats 2024 → 2025" },
        { value: "~280 Mrd. €", label: "Klimainvestitionen, die bis 2030 fehlen" },
        { value: "0,35 % BIP", label: "erlaubte neue Schulden (Schuldenbremse)" },
      ],
    },
    {
      type: "outro",
      durationInFrames: 150,
      audio: null,
      streitfrage: "Du sitzt im Bundeskabinett. Wohin fließt das zusätzliche Geld?",
    },
  ],
};
