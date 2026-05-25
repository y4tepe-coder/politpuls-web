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

export type DossierChoice = {
  id: ChoiceId;
  label: string;
  tone?: string;
  bullets: string[];
  spektrum_delta: SpektrumDisplay;
  spektrum_delta_raw?: Partial<SpektrumRaw>;
  affected_groups: string[];
};

export type DossierFact = { label: string; value: string };

export type DossierSource = { title: string; url: string; outlet?: string };

export type DossierConsequence = {
  cheers: string[];
  upset: string[];
  summary: string;
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
  model_version: string | null;
  prompt_version: string | null;
  generation_log_id: string | null;
  factcheck_passed: boolean;
  balance_score: number | null;
  published: boolean;
  published_at: string | null;
  topic_tags: string[];
  phase: "daily" | "wahlkampf";
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
