import type { Party } from "./types";

// Initial positions for the 7 German Bundestag-relevant parties on the
// 2-axis political compass. Numbers are an approximation synthesised from
// commonly cited compass placements (Wahl-O-Mat data, political-compass.org
// estimates, academic placements like Manifesto Project / CHES).
//
// These should be calibrated with a methodical review before launch — for
// now they're "directionally right" so the UI is meaningful, but they're
// not authoritative claims. Source review tracked as a v1 launch gate.
export const parties: Party[] = [
  {
    id: "cdu",
    name: "CDU/CSU",
    shortName: "CDU",
    color: "#000000",
    position: { economic: 35, social: -10 },
  },
  {
    id: "spd",
    name: "SPD",
    shortName: "SPD",
    color: "#E3000F",
    position: { economic: -15, social: 10 },
  },
  {
    id: "gruene",
    name: "Bündnis 90/Die Grünen",
    shortName: "Grüne",
    color: "#1AA037",
    position: { economic: -10, social: 35 },
  },
  {
    id: "fdp",
    name: "FDP",
    shortName: "FDP",
    color: "#FFED00",
    position: { economic: 40, social: 15 },
  },
  {
    id: "linke",
    name: "Die Linke",
    shortName: "Linke",
    color: "#BE3075",
    position: { economic: -50, social: 25 },
  },
  {
    id: "afd",
    name: "AfD",
    shortName: "AfD",
    color: "#009EE0",
    position: { economic: 15, social: -45 },
  },
  {
    id: "bsw",
    name: "Bündnis Sahra Wagenknecht",
    shortName: "BSW",
    color: "#7D2E47",
    position: { economic: -25, social: -20 },
  },
];

export function getPartyById(id: string): Party | undefined {
  return parties.find((p) => p.id === id);
}
