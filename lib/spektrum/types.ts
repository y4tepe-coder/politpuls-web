// Display-level spektrum: classic 2-axis political compass.
//   economic: -100 (left, more state) ↔ +100 (right, more market)
//   social:   -100 (conservative/authoritarian) ↔ +100 (progressive/libertarian)
export type SpektrumVector = {
  economic: number;
  social: number;
};

// Raw 6-axis vector — stored from day one so we can upgrade the UI in v1.5
// without losing historical data.
export type SpektrumRaw = {
  kultur: number;
  umwelt: number;
  soziales: number;
  wirtschaft: number;
  sicherheit: number;
  bildung: number;
};

export type PartyId =
  | "cdu"
  | "spd"
  | "gruene"
  | "fdp"
  | "linke"
  | "afd"
  | "bsw";

export type Party = {
  id: PartyId;
  name: string;
  shortName: string;
  color: string;
  position: SpektrumVector;
};

export type PartyProximity = {
  party: Party;
  distance: number; // Euclidean, 0 = perfect match
  proximity: number; // 0..1, 1 = perfect match
};
