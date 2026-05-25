import type { Dossier } from "@/lib/supabase/types";

// Hand-written seed dossier so /heute works before the AI pipeline is live.
// Topic chosen to be evergreen-ish: a typical German budget trade-off.
export const seedDossier: Dossier = {
  id: "seed-2026-05-25",
  publish_date: "2026-05-25",
  slug: "haushalt-2027-verteidigung-oder-klima",
  headline: "Mehr Geld für die Bundeswehr — oder für den Klimaschutz?",
  kicker: "Bundeshaushalt 2027",
  deck:
    "Die Koalition streitet, wohin im nächsten Haushalt das frische Geld geht. Eine Entscheidung muss noch dieses Jahr fallen.",
  body: [],
  facts: [
    {
      label: "Steigerung des Verteidigungsetats 2024 → 2025",
      value: "+11 %",
    },
    {
      label: "Klimainvestitionen, die bis 2030 fehlen",
      value: "~280 Mrd. €",
    },
    {
      label: "Schuldenbremse erlaubt zusätzliche Neuverschuldung von",
      value: "0,35 % des BIP",
    },
  ],
  glossar: {
    Schuldenbremse:
      "Im Grundgesetz festgeschrieben: Bund darf max. 0,35 % des BIP pro Jahr neu verschulden. Soll Haushaltsdisziplin sichern.",
    Verteidigungsetat:
      "Geld, das der Bund pro Jahr für Bundeswehr, Beschaffung und NATO-Beiträge ausgibt.",
    Klimainvestitionen:
      "Ausgaben für Energiewende, Verkehrswende, Wärme­wende — alles, was Treibhausgase reduziert.",
  },
  streitfrage:
    "Du sitzt im Bundeskabinett. Wohin fließt das zusätzliche Geld?",
  choices: [
    {
      id: "A",
      label: "Bundeswehr aufstocken",
      tone: "security",
      bullets: [
        "NATO-Ziel 2 % BIP übererfüllen",
        "Munition, Drohnen, Cyber",
        "Signal an Russland",
      ],
      spektrum_delta: { economic: 18, social: -10 },
      affected_groups: ["CDU/CSU-Wähler:innen", "AfD-Wähler:innen"],
    },
    {
      id: "B",
      label: "Klimainvestitionen ausweiten",
      tone: "climate",
      bullets: [
        "Solar, Wind, Wärmepumpen",
        "Bahn statt Autobahn",
        "1,5-Grad-Pfad halten",
      ],
      spektrum_delta: { economic: -12, social: 22 },
      affected_groups: ["Grüne-Wähler:innen", "SPD-Wähler:innen"],
    },
    {
      id: "C",
      label: "Beides — bezahlt durch Reichensteuer",
      tone: "social",
      bullets: [
        "Vermögensteuer reaktivieren",
        "Spitzensteuersatz ab 1 Mio €",
        "Erbschaftsteuer-Schlupflöcher schließen",
      ],
      spektrum_delta: { economic: -28, social: 12 },
      affected_groups: ["Linke-Wähler:innen", "SPD-Wähler:innen"],
    },
    {
      id: "D",
      label: "Beides — bezahlt mit neuen Schulden",
      tone: "growth",
      bullets: [
        "Schuldenbremse reformieren",
        "Sondervermögen einrichten",
        "Wachstum finanziert Rückzahlung",
      ],
      spektrum_delta: { economic: 8, social: 6 },
      affected_groups: ["FDP-Wähler:innen", "Wirtschaftsverbände"],
    },
  ],
  consequences: {
    A: {
      cheers: ["CDU/CSU", "AfD", "Bundeswehrverband"],
      upset: ["Grüne", "Linke", "Friedensbewegung"],
      summary:
        "Du setzt klar auf Sicherheit. Die Union feiert dich, das progressive Lager wirft dir vor, den Klimaschutz zu opfern.",
    },
    B: {
      cheers: ["Grüne", "SPD-Linke", "Fridays for Future"],
      upset: ["AfD", "Wirtschaftsrat der CDU"],
      summary:
        "Du priorisierst Klima. Junge Wähler:innen jubeln, Sicherheitspolitiker werfen dir Naivität gegenüber Russland vor.",
    },
    C: {
      cheers: ["Linke", "Gewerkschaften", "SPD-Basis"],
      upset: ["FDP", "Wirtschaftsverbände", "Vermögensverwalter"],
      summary:
        "Du holst dir das Geld bei den Reichsten. Linke und SPD sind begeistert, der Wirtschaftsflügel schreit Standortrisiko.",
    },
    D: {
      cheers: ["FDP", "Wirtschaftsrat", "Bauindustrie"],
      upset: ["Linke", "Bund der Steuerzahler", "Sparer-Lobby"],
      summary:
        "Du finanzierst alles über Schulden. Wachstumsoptimisten feiern dich, Inflationskritiker warnen vor der nächsten Generation.",
    },
  },
  sources: [
    {
      title: "Bundeshaushalt 2025 — Eckwerte",
      url: "https://www.bundesfinanzministerium.de",
      outlet: "BMF",
    },
    {
      title: "NATO-Verteidigungsausgaben Übersicht",
      url: "https://www.nato.int",
      outlet: "NATO",
    },
  ],
  model_version: "seed",
  prompt_version: "seed-v1",
  generation_log_id: null,
  factcheck_passed: true,
  balance_score: 0.85,
  published: true,
  published_at: "2026-05-25T05:00:00Z",
  topic_tags: ["haushalt", "verteidigung", "klima"],
  phase: "daily",
  created_at: "2026-05-25T05:00:00Z",
};
