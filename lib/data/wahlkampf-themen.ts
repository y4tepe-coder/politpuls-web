// 12 Wahlkampf-Kernthemen. User wählt 3 davon als Wahlversprechen.
// Icons stammen aus lucide-react (string identifier, in der UI mapped).
// Inspiriert von iOS Wahlkampf-Programm-Step.

export type WahlkampfThema = {
  id: string;
  label: string;
  icon: string; // lucide-react icon name
  pastel: "sky" | "rose" | "mint" | "peach" | "lavender" | "sand";
  blurb: string;
};

export const WAHLKAMPF_THEMEN: WahlkampfThema[] = [
  {
    id: "klima",
    label: "Klima & Energie",
    icon: "Leaf",
    pastel: "mint",
    blurb: "Erneuerbare, Wärmewende, CO₂-Pfad",
  },
  {
    id: "wirtschaft",
    label: "Wirtschaft & Arbeit",
    icon: "Briefcase",
    pastel: "sky",
    blurb: "Standort, Industrie, Fachkräfte",
  },
  {
    id: "migration",
    label: "Migration",
    icon: "Globe",
    pastel: "peach",
    blurb: "Asyl, Integration, Grenzen",
  },
  {
    id: "bildung",
    label: "Bildung",
    icon: "GraduationCap",
    pastel: "lavender",
    blurb: "Schule, Studium, Berufsausbildung",
  },
  {
    id: "soziales",
    label: "Soziales",
    icon: "HandHelping",
    pastel: "rose",
    blurb: "Rente, Bürgergeld, Mindestlohn",
  },
  {
    id: "wohnen",
    label: "Wohnen",
    icon: "Home",
    pastel: "sand",
    blurb: "Mieten, Neubau, Eigentum",
  },
  {
    id: "sicherheit",
    label: "Sicherheit",
    icon: "Shield",
    pastel: "sky",
    blurb: "Bundeswehr, Polizei, Cyber",
  },
  {
    id: "gesundheit",
    label: "Gesundheit",
    icon: "HeartPulse",
    pastel: "rose",
    blurb: "Krankenhäuser, Pflege, Versorgung",
  },
  {
    id: "digital",
    label: "Digitalisierung",
    icon: "Wifi",
    pastel: "lavender",
    blurb: "Verwaltung, Glasfaser, KI",
  },
  {
    id: "mobilitaet",
    label: "Mobilität",
    icon: "Train",
    pastel: "mint",
    blurb: "Bahn, Auto, ÖPNV, Radwege",
  },
  {
    id: "steuern",
    label: "Steuern & Schulden",
    icon: "Coins",
    pastel: "peach",
    blurb: "Haushalt, Reichensteuer, Schuldenbremse",
  },
  {
    id: "europa",
    label: "Europa & Außen",
    icon: "Compass",
    pastel: "sand",
    blurb: "EU, NATO, Ukraine, China",
  },
];

export const MAX_PROGRAMM_THEMEN = 3;
