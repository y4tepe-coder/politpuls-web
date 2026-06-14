// Fakt oder Spin? — Datensatz für das Medienkompetenz-Minigame.
//
// Strenge Überparteilichkeit: Alle Behauptungen beurteilen die QUALITÄT einer
// Aussage (Faktentreue, Methodik, Kontext), nicht welche Partei im Recht ist.
// Kein fabriziertes Zitat einer echten Person.

export type FaktSpinClaim = {
  id: string;
  // Die zu beurteilende Aussage (Schlagzeile, Statement, Statistic).
  text: string;
  // true = sachlich korrekt und belegt, false = Manipulationstechnik.
  isFakt: boolean;
  // Nur bei isFakt === false: deutschsprachiger Name der Technik.
  technik?: string;
  // Eine kurze Erklärung, warum es Fakt oder Spin ist.
  aufloesung: string;
};

export const FAKT_SPIN_CLAIMS: FaktSpinClaim[] = [
  {
    id: "fs-001",
    text: "Eine Partei, die bei der Bundestagswahl weniger als 5 % der Zweitstimmen erhält, zieht in der Regel nicht in den Bundestag ein.",
    isFakt: true,
    aufloesung:
      "Korrekt. Die 5-%-Sperrklausel (§ 6 Abs. 3 BWahlG) gilt grundsätzlich — Ausnahme: mindestens 3 Direktmandate.",
  },
  {
    id: "fs-002",
    text: "Die Bundesregierung 'hat die Staatsschulden verdoppelt' — laut einer aktuellen Studie.",
    isFakt: false,
    technik: "Fehlender Kontext",
    aufloesung:
      'Spin: Ohne Zeitraum, Bezugsgröße (absolut vs. BIP-Anteil) und Quelle der „Studie“ ist die Aussage nicht prüfbar.',
  },
  {
    id: "fs-003",
    text: "Im deutschen Grundgesetz steht, dass alle Staatsgewalt vom Volke ausgeht (Art. 20 Abs. 2 GG).",
    isFakt: true,
    aufloesung:
      "Korrekt und wörtlich in Art. 20 Abs. 2 GG nachlesbar — ein Fakt, der direkt aus dem Verfassungstext folgt.",
  },
  {
    id: "fs-004",
    text: "Kriminalität in Deutschland steigt seit Jahren — das beweisen die absoluten Fallzahlen der Polizeilichen Kriminalstatistik.",
    isFakt: false,
    technik: "Verdrehte Statistik",
    aufloesung:
      "Spin: Absolute Fallzahlen ohne Bevölkerungsbereinigung oder Anzeigeverhalten können eine täuschende Tendenz erzeugen.",
  },
  {
    id: "fs-005",
    text: "Um eine Koalitionsregierung zu bilden, braucht die Bundesregierung eine Mehrheit der Mitglieder des Bundestages (Art. 63 GG).",
    isFakt: true,
    aufloesung:
      "Korrekt. Der Bundeskanzler wird mit absoluter Mehrheit der Bundestagsmitglieder gewählt — das ist in Art. 63 GG festgelegt.",
  },
  {
    id: "fs-006",
    text: "In Land X sind Steuern niedrig UND die Schulen sind besser — deshalb sollten wir dort die gleichen Steuersätze einführen.",
    isFakt: false,
    technik: "Falscher Vergleich",
    aufloesung:
      "Spin: Länder unterscheiden sich in Wirtschaftsstruktur, Föderalismus und Sozialleistungen — ein direkter Ursache-Wirkungs-Vergleich greift zu kurz.",
  },
  {
    id: "fs-007",
    text: "Der Bundesrat besteht aus Vertreterinnen und Vertretern der Landesregierungen und ist kein direkt gewähltes Parlament.",
    isFakt: true,
    aufloesung:
      "Korrekt. Der Bundesrat setzt sich aus Mitgliedern der Landesregierungen zusammen (Art. 51 GG) und wird nicht direkt von der Bevölkerung gewählt.",
  },
  {
    id: "fs-008",
    text: "Partei A kritisiert die Wirtschaftspolitik von Partei B. Aber Partei A hat selbst in früheren Jahren Schulden gemacht — also ist ihre Kritik ungültig.",
    isFakt: false,
    technik: "Whataboutism",
    aufloesung:
      "Spin: Frühere eigene Fehler machen eine sachlich berechtigte Kritik nicht automatisch falsch — das ist Whataboutism.",
  },
  {
    id: "fs-009",
    text: "Schlagzeile: 'Studie: Sozialleistungen machen arm!' — laut einer im Artikel nicht näher genannten Untersuchung.",
    isFakt: false,
    technik: "Irreführende Überschrift",
    aufloesung:
      "Spin: Die Überschrift übertreibt oder verzerrt den tatsächlichen Befund der Studie; ohne Verlinkung/Nennung der Quelle ist keine Überprüfung möglich.",
  },
  {
    id: "fs-010",
    text: "Wer Klimaschutzmaßnahmen ablehnt, will eigentlich, dass unsere Kinder keine Zukunft haben.",
    isFakt: false,
    technik: "Strohmann",
    aufloesung:
      "Spin: Die tatsächliche Position (z.B. Skepsis gegenüber bestimmten Maßnahmen) wird zu einer extremen, leichter angreifbaren Position übertrieben — klassischer Strohmann.",
  },
];
