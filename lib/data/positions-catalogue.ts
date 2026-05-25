import type { PartyId } from "@/lib/spektrum/types";

// 18 Aussagen in 6 Kategorien, mit der Partei-Position pro Aussage.
// 1:1 portiert aus iOS POSITIONS_CATALOGUE
// (ios/Politpuls/Models/OnboardingData.swift).

export type Stance = "ja" | "neutral" | "nein";

export type PositionItem = {
  id: string;
  text: string;
  stances: Record<PartyId, Stance>;
};

export type PositionCategory = {
  id: string;
  label: string;
  color: string;
  blurb: string;
  items: PositionItem[];
};

export const POSITIONS_CATALOGUE: PositionCategory[] = [
  {
    id: "kultur",
    label: "Kultur",
    color: "#7A6E48",
    blurb: "3 Aussagen zu Sprache, Medien & Identität.",
    items: [
      {
        id: "k1",
        text: "Genderneutrale Sprache in Behörden verbindlich machen",
        stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "nein" },
      },
      {
        id: "k2",
        text: "Öffentlich-rechtlichen Rundfunk im jetzigen Umfang erhalten",
        stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" },
      },
      {
        id: "k3",
        text: "Deutsche Leitkultur im Grundgesetz verankern",
        stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "neutral", linke: "nein", afd: "ja", bsw: "ja" },
      },
    ],
  },
  {
    id: "umwelt",
    label: "Umwelt",
    color: "#2E9F5D",
    blurb: "3 Aussagen zu Klima, Verkehr & Energie.",
    items: [
      {
        id: "u1",
        text: "Tempolimit 130 km/h auf Autobahnen",
        stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" },
      },
      {
        id: "u2",
        text: "Kohleausstieg auf 2030 vorziehen",
        stances: { cdu: "nein", spd: "neutral", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" },
      },
      {
        id: "u3",
        text: "Atomkraft als Brückentechnologie reaktivieren",
        stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" },
      },
    ],
  },
  {
    id: "soziales",
    label: "Soziales",
    color: "#B9343A",
    blurb: "3 Aussagen zu Lohn, Wohnen & Bürgergeld.",
    items: [
      {
        id: "s1",
        text: "Mindestlohn auf 15 € pro Stunde anheben",
        stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "neutral", bsw: "ja" },
      },
      {
        id: "s2",
        text: "Bürgergeld kürzen bei Annahme-Verweigerung von zumutbarer Arbeit",
        stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" },
      },
      {
        id: "s3",
        text: "Mietpreisbremse bundesweit ausweiten",
        stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "neutral", bsw: "ja" },
      },
    ],
  },
  {
    id: "wirtschaft",
    label: "Wirtschaft",
    color: "#1B5FAE",
    blurb: "3 Aussagen zu Steuern, Schulden & Vermögen.",
    items: [
      {
        id: "w1",
        text: "Unternehmenssteuern auf 25 % senken",
        stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" },
      },
      {
        id: "w2",
        text: "Schuldenbremse im Grundgesetz lockern",
        stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "ja" },
      },
      {
        id: "w3",
        text: "Vermögenssteuer ab 1 Mio. € einführen",
        stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "ja" },
      },
    ],
  },
  {
    id: "sicherheit",
    label: "Sicherheit",
    color: "#2D2D44",
    blurb: "3 Aussagen zu Verteidigung, Asyl & Daten.",
    items: [
      {
        id: "si1",
        text: "Bundeswehr-Etat dauerhaft auf 3 % des BIP",
        stances: { cdu: "ja", spd: "neutral", gruene: "neutral", fdp: "ja", linke: "nein", afd: "ja", bsw: "nein" },
      },
      {
        id: "si2",
        text: "Asylverfahren in Drittstaaten an EU-Außengrenze auslagern",
        stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "ja" },
      },
      {
        id: "si3",
        text: "Vorratsdatenspeicherung wieder einführen",
        stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "nein", linke: "nein", afd: "ja", bsw: "neutral" },
      },
    ],
  },
  {
    id: "bildung",
    label: "Bildung",
    color: "#C48A05",
    blurb: "3 Aussagen zu Schule, Uni & Digitalpakt.",
    items: [
      {
        id: "b1",
        text: "Digitalpakt 2.0: Tablets und Glasfaser für alle Schulen",
        stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "ja", linke: "ja", afd: "nein", bsw: "ja" },
      },
      {
        id: "b2",
        text: "Mehr Lehrkräfte einstellen, Klassen verkleinern",
        stances: { cdu: "ja", spd: "ja", gruene: "ja", fdp: "neutral", linke: "ja", afd: "nein", bsw: "ja" },
      },
      {
        id: "b3",
        text: "Studiengebühren ab dem Zweitstudium einführen",
        stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "neutral", bsw: "nein" },
      },
    ],
  },
];

export const ALL_POSITIONS: PositionItem[] = POSITIONS_CATALOGUE.flatMap(
  (c) => c.items,
);
