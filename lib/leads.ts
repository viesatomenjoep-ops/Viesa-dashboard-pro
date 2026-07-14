/** Types en constanten voor de leads-/pipeline-module (canoniek datamodel). */

export type LeadStatus = "nieuw" | "contact_gehad" | "audit_offerte" | "gewonnen";
export type LeadBron = "prospector" | "handmatig";

export type LeadSignaal = {
  type: string;
  waarde?: string;
  bron?: string;
};

export type Lead = {
  id: string;
  bedrijf: string;
  plaats: string | null;
  website: string | null;
  contact_naam: string | null;
  email: string | null;
  telefoon: string | null;
  bron: LeadBron;
  score: number;
  verwachte_waarde: number;
  signalen: LeadSignaal[];
  openingszin: string | null;
  status: LeadStatus;
  positie: number;
  notities: string | null;
  created_at: string;
  updated_at: string;
};

/** De kanban-kolommen, in volgorde. */
export const LEAD_STATUSSEN: { key: LeadStatus; label: string }[] = [
  { key: "nieuw", label: "Nieuw" },
  { key: "contact_gehad", label: "Contact gehad" },
  { key: "audit_offerte", label: "Audit/offerte" },
  { key: "gewonnen", label: "Gewonnen" },
];

export const LEAD_STATUS_KEYS = LEAD_STATUSSEN.map((s) => s.key);

export function leadStatusLabel(status: LeadStatus): string {
  return LEAD_STATUSSEN.find((s) => s.key === status)?.label ?? status;
}

/** Kleurtoon voor de score-badge. */
export function scoreToon(score: number): "groen" | "oranje" | "grijs" {
  if (score >= 70) return "groen";
  if (score >= 40) return "oranje";
  return "grijs";
}
