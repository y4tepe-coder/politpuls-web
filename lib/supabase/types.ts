// Hand-written subset of database types — convenient while the project is not yet linked.
// Once linked, generate the full set with:
//   npm run db:types
// and prefer the generated file (lib/supabase/types.gen.ts) in new code.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SpektrumDisplay = { economic: number; social: number };

export type SpektrumRaw = {
  kultur: number;
  umwelt: number;
  soziales: number;
  wirtschaft: number;
  sicherheit: number;
  bildung: number;
};

export type ChoiceId = "A" | "B" | "C" | "D";

export type DossierDelta = {
  label: string;
  delta: number; // signed percent, e.g. +5 or -3
  unit?: string;
  good: boolean; // colors the pill green vs. red
  note?: string;
};

export type DossierChoice = {
  id: ChoiceId;
  label: string;
  tone?: string;
  bullets: string[];
  spektrum_delta: SpektrumDisplay;
  spektrum_delta_raw?: Partial<SpektrumRaw>;
  affected_groups: string[];
  // Press chat step (ported from iOS DecisionView step 2):
  press_question?: string;
  press_presets?: string[];
  // Impact rows shown on the consequence screen:
  deltas?: DossierDelta[];
};

export type PressPersona = {
  name: string;
  role: string;
  outlet: string;
  initials: string;
  gradient_from: string; // tailwind color e.g. "from-amber-400"
  gradient_to: string; // tailwind color e.g. "to-rose-500"
};

export type DossierFact = { label: string; value: string };

export type DossierSource = { title: string; url: string; outlet?: string };

export type DossierConsequence = {
  cheers: string[];
  upset: string[];
  summary: string;
};

// Which interaction pattern the daily article renders. The pipeline rotates
// this per day so each day differs and the reporter chat is not shown daily.
export type DossierFormat =
  | "decision"
  | "reporter-chat"
  | "koalition"
  | "plakat"
  | "meinung"
  | "faktencheck";

// Nullable, embeddable clip slot — a kurzer "Short" zum Thema (YouTube/Reel-Embed).
export type DossierVideo = {
  title: string;
  url: string | null;
  channel?: string;
  ticker?: string;
  blurb?: string;
  runtime?: string;
  time?: string;
};

// Nullable image slot — ein "Zeitungsartikel"-Bild zum Thema (Vorschaubild einer
// Quelle / themenbezogenes Pressefoto). Spiegelt DossierVideo: wird nur gezeigt,
// wenn die Redaktion eine URL liefert.
export type DossierImage = {
  url: string;
  caption?: string; // kurze Bildunterschrift, max ~12 Wörter
  source?: string; // Bildnachweis / Outlet
  alt?: string;
};

// Mehrere themenbezogene Bilder als wischbares Karussell auf der Bild-Karte.
// Abwärtskompatibel zum einzelnen `image`: die UI zeigt [...images, image] und
// blendet kaputte URLs zur Laufzeit per onError aus. Nur echte, einbettbare
// URLs (z.B. og:image der zitierten Quellen); im Zweifel leer/weglassen.
export type DossierGallery = DossierImage[];

// "Was meinst du?" — kurze Meinungsfrage. Nach dem Abstimmen sieht der Nutzer,
// wie die Community abgestimmt hat (echte Stimmen via dossier_votes), die
// Begründung jeder Seite und eine neutrale Einordnung ("Warum").
export type DossierMeinungOption = {
  id: string; // kurze id, z.B. "ja" | "nein" | "a" | "b" (max 20 Zeichen)
  label: string; // die Position in wenigen Worten
  begruendung: string; // ein Satz: das stärkste Argument FÜR diese Seite
};

export type DossierMeinung = {
  frage: string; // Meinungsfrage in Du-Form
  optionen: DossierMeinungOption[]; // 2–3 Optionen
  einordnung: string; // "Warum": neutraler Kontext, warum die Meinungen auseinandergehen
};

// Fake-News-Abhärtung (Prebunking): eine echt aussehende Behauptung, die der
// Nutzer als echt/fake einschätzt — danach Auflösung + Erkennungs-Tipp.
export type DossierFaktencheck = {
  behauptung: string; // die Aussage/Schlagzeile, wie sie kursieren könnte
  praesentation?: string; // Optik der Verbreitung, z.B. "Sharepic auf Instagram"
  ist_echt: boolean; // true = stimmt wirklich, false = falsch/irreführend
  aufloesung: string; // was tatsächlich korrekt ist
  warum: string; // warum es irreführend ist bzw. (wenn echt) warum es trotzdem stimmt
  tipp: string; // übertragbarer Medienkompetenz-Tipp ("Woran du sowas erkennst")
};

export type Dossier = {
  id: string;
  publish_date: string;
  slug: string;
  headline: string;
  kicker: string | null;
  deck: string | null;
  body: Json;
  facts: DossierFact[];
  glossar: Record<string, string>;
  streitfrage: string | null;
  choices: DossierChoice[];
  consequences: Record<ChoiceId, DossierConsequence>;
  sources: DossierSource[];
  press?: PressPersona;
  model_version: string | null;
  prompt_version: string | null;
  generation_log_id: string | null;
  factcheck_passed: boolean;
  balance_score: number | null;
  published: boolean;
  published_at: string | null;
  topic_tags: string[];
  phase: "daily" | "wahlkampf";
  // Modular daily format + embeddable video + Artikel-Bild. Alle nullable, damit
  // bestehende Rows + der hand-geschriebene Seed weiter funktionieren;
  // resolveFormat() füllt format, image/video werden nur bei URL angezeigt.
  format: DossierFormat | null;
  video: DossierVideo | null;
  // Format-spezifische Nutzdaten (nullable; resolveFormat fällt sonst auf
  // decision zurück). Werden täglich mitgeneriert, damit jeder Tag jedes
  // Format rendern kann.
  meinung: DossierMeinung | null;
  faktencheck: DossierFaktencheck | null;
  image: DossierImage | null;
  images?: DossierGallery | null; // optionales Bild-Karussell (zusätzlich zu image)
  created_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  is_anonymous: boolean;
  spektrum: SpektrumDisplay;
  spektrum_raw: SpektrumRaw;
  current_streak: number;
  longest_streak: number;
  last_briefing_date: string | null;
  streak_saves_left: number;
  difficulty: "einfach" | "standard" | "schwer";
  role: string | null;
  party_id: string | null;
  xp: number;
  created_at: string;
  updated_at: string;
};

export type Decision = {
  id: string;
  user_id: string;
  dossier_id: string;
  choice_id: ChoiceId;
  decided_at: string;
  spektrum_before: SpektrumDisplay & { raw?: SpektrumRaw };
  spektrum_after: SpektrumDisplay & { raw?: SpektrumRaw };
};
