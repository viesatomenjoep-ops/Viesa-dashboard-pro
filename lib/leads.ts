/** Gedeelde types en constanten voor de leads-/pipeline-module. */

export type LeadStage =
  | "nieuw"
  | "gekwalificeerd"
  | "contact"
  | "offerte"
  | "gewonnen"
  | "verloren";

export type LeadBron = "prospector" | "handmatig";

/** Eén signaal zoals de webshop-prospector dat aanlevert. */
export type LeadSignaal = {
  type: string;
  waarde?: string;
  bron?: string;
};

export type Lead = {
  id: string;
  bedrijfsnaam: string;
  website: string | null;
  contact_naam: string | null;
  email: string | null;
  telefoon: string | null;
  bron: LeadBron;
  score: number;
  signalen: LeadSignaal[];
  openingszin: string | null;
  stage: LeadStage;
  positie: number;
  geschatte_waarde: number;
  klant_id: string | null;
  notities: string | null;
  created_at: string;
  updated_at: string;
};

/** De pipeline-kolommen, in volgorde. */
export const LEAD_STAGES: { key: LeadStage; label: string }[] = [
  { key: "nieuw", label: "Nieuw" },
  { key: "gekwalificeerd", label: "Gekwalificeerd" },
  { key: "contact", label: "Contact" },
  { key: "offerte", label: "Offerte" },
  { key: "gewonnen", label: "Gewonnen" },
  { key: "verloren", label: "Verloren" },
];

export const LEAD_STAGE_KEYS = LEAD_STAGES.map((s) => s.key);

/** Stages die als "actieve deal" tellen (niet gewonnen/verloren). */
export const ACTIEVE_STAGES: LeadStage[] = [
  "nieuw",
  "gekwalificeerd",
  "contact",
  "offerte",
];

export function stageLabel(stage: LeadStage): string {
  return LEAD_STAGES.find((s) => s.key === stage)?.label ?? stage;
}

/** Kleurtoon voor de score-badge. */
export function scoreToon(score: number): "groen" | "oranje" | "grijs" {
  if (score >= 70) return "groen";
  if (score >= 40) return "oranje";
  return "grijs";
}
