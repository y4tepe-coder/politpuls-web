// TV-Triell: 5 Fragen × 3 Antworten. Zwei simulierte Gegnerinnen, ein:e
// Moderator:in, und du. Antworten haben "popularity" für den Score.
//
// Personas sind FIKTIV — leicht verfremdete Namen ähnlich zu bekannten
// dt. Politiker:innen / TV-Moderator:innen. Wir zeigen die Partei klar,
// damit die politische Position erkennbar bleibt. Statements sind
// realistisch, aber nicht zitiert.

export type TriellAnswer = {
  id: string;
  label: string;
  popularity: number;
};

export type TriellFrage = {
  id: string;
  topic: string;
  question: string;
  moderator: string;
  opponentA: { name: string; party: string; statement: string };
  opponentB: { name: string; party: string; statement: string };
  answers: TriellAnswer[];
};

export const TV_TRIELL_FRAGEN: TriellFrage[] = [
  {
    id: "klima-vs-wirtschaft",
    topic: "Klima & Wirtschaft",
    question:
      "Wenn morgen Industrie und Klimaschutz kollidieren — was hat Vorrang?",
    moderator: "Sarah Maischner",
    opponentA: {
      name: "Lena Baermann",
      party: "Grüne",
      statement:
        "Die Klimakrise ist die wirtschaftliche Krise. Wer Klima rettet, rettet auch unsere Wirtschaft.",
    },
    opponentB: {
      name: "Friedrich Mertel",
      party: "CDU",
      statement:
        "Erst der Wohlstand, dann der Klimaschutz. Sonst verliert Deutschland seinen Standort.",
    },
    answers: [
      {
        id: "a",
        label: "Klima zuerst — aber mit echten Wirtschaftsprogrammen",
        popularity: 4,
      },
      {
        id: "b",
        label: "Wirtschaft zuerst — Klima muss bezahlbar bleiben",
        popularity: 3,
      },
      {
        id: "c",
        label: "Beides parallel — Klima IST Wirtschaft der Zukunft",
        popularity: 6,
      },
    ],
  },
  {
    id: "migration",
    topic: "Migration",
    question:
      "Drittstaaten-Asylverfahren an der EU-Außengrenze — Ja oder Nein?",
    moderator: "Maybrit Iller",
    opponentA: {
      name: "Friedrich Mertel",
      party: "CDU",
      statement:
        "Ja. Wir können nicht alle aufnehmen. Drittstaaten-Verfahren sind der einzige Weg.",
    },
    opponentB: {
      name: "Robin Habich",
      party: "Grüne",
      statement:
        "Nein. Das ist Menschenrechte aufgeben. Wir müssen integrieren, nicht abschieben.",
    },
    answers: [
      {
        id: "a",
        label: "Ja, aber nur mit Menschenrechts-Standards",
        popularity: 5,
      },
      {
        id: "b",
        label: "Nein, das löst nichts — nur Integration funktioniert",
        popularity: 2,
      },
      {
        id: "c",
        label: "Kompromiss: schnellere Asyl-Verfahren in Deutschland",
        popularity: 4,
      },
    ],
  },
  {
    id: "verteidigung",
    topic: "Verteidigung",
    question:
      "Bundeswehr-Etat dauerhaft auf 3 % BIP — wie stehst du dazu?",
    moderator: "Markus Lange",
    opponentA: {
      name: "Friedrich Mertel",
      party: "CDU",
      statement:
        "Ja. Wir brauchen eine wehrhafte Demokratie. Russland zeigt es uns täglich.",
    },
    opponentB: {
      name: "Sara Waagenstein",
      party: "BSW",
      statement:
        "Nein. Aufrüstung schafft keine Sicherheit. Wir brauchen Diplomatie.",
    },
    answers: [
      { id: "a", label: "Ja, 3 % sind Pflicht für unsere Sicherheit", popularity: 3 },
      { id: "b", label: "Nein, das ist Aufrüstungs-Wahnsinn", popularity: -2 },
      { id: "c", label: "2 % reichen, aber gut investiert", popularity: 5 },
    ],
  },
  {
    id: "rente",
    topic: "Rente",
    question:
      "Renteneintrittsalter erhöhen, weil wir länger leben — Ja oder Nein?",
    moderator: "Sarah Maischner",
    opponentA: {
      name: "Christof Lindstedt",
      party: "FDP",
      statement:
        "Wir müssen das Renteneintrittsalter mit der Lebenserwartung koppeln. Sonst kollabiert das System.",
    },
    opponentB: {
      name: "Janine Wissmann",
      party: "Linke",
      statement:
        "Nein. Wer hart gearbeitet hat, soll früher in Rente. Das Geld ist da — bei den Reichen.",
    },
    answers: [
      { id: "a", label: "Ja, Kopplung an Lebenserwartung", popularity: -1 },
      { id: "b", label: "Nein, Vermögensteuer statt längeres Arbeiten", popularity: 6 },
      { id: "c", label: "Flexibel: wer länger will, kann — niemand muss", popularity: 5 },
    ],
  },
  {
    id: "bildung",
    topic: "Bildung",
    question:
      "100 Mrd. € Sondervermögen für Schulen — mit neuen Schulden finanzieren?",
    moderator: "Maybrit Iller",
    opponentA: {
      name: "Olaf Schillemann",
      party: "SPD",
      statement:
        "Ja. Bildung ist Zukunft. Wir können uns nicht leisten, das zu sparen.",
    },
    opponentB: {
      name: "Christof Lindstedt",
      party: "FDP",
      statement:
        "Nein. Neue Schulden lähmen die nächste Generation. Geld umverteilen, nicht aufnehmen.",
    },
    answers: [
      { id: "a", label: "Ja — Investition zahlt sich aus", popularity: 5 },
      { id: "b", label: "Nein — anderswo kürzen (z.B. Rüstung)", popularity: 3 },
      { id: "c", label: "Reichensteuer einführen, das finanziert es", popularity: 4 },
    ],
  },
];
