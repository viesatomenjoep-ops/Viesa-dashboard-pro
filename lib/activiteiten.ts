/** Types en constanten voor activiteiten (log + follow-ups). */

export type ActiviteitType =
  | "notitie"
  | "call"
  | "email"
  | "follow_up"
  | "taak"
  | "systeem";

export type ActiviteitStatus = "open" | "afgerond";

/** Hoe een belgesprek afliep (migratie 0040). Alleen gevuld bij type 'call'. */
export type BelUitkomst =
  | "bereikt"
  | "voicemail"
  | "niet_opgenomen"
  | "terugbellen"
  | "afspraak"
  | "geen_interesse";

export type Activiteit = {
  id: string;
  lead_id: string | null;
  type: ActiviteitType;
  titel: string | null;
  omschrijving: string | null;
  status: ActiviteitStatus;
  follow_up_datum: string | null;
  afgerond_op: string | null;
  uitkomst?: BelUitkomst | null;
  created_at: string;
  updated_at: string;
};

export const BEL_UITKOMSTEN: {
  key: BelUitkomst;
  label: string;
  /** Zet de lead standaard weer op de bellijst? */
  blijftOpLijst: boolean;
  /** Voorstel voor het aantal dagen tot de follow-up. */
  followupNaDagen: number | null;
}[] = [
  { key: "bereikt", label: "Gesproken", blijftOpLijst: false, followupNaDagen: 7 },
  { key: "afspraak", label: "Afspraak gemaakt", blijftOpLijst: false, followupNaDagen: null },
  { key: "voicemail", label: "Voicemail ingesproken", blijftOpLijst: true, followupNaDagen: 3 },
  { key: "niet_opgenomen", label: "Niet opgenomen", blijftOpLijst: true, followupNaDagen: 1 },
  { key: "terugbellen", label: "Wil teruggebeld worden", blijftOpLijst: true, followupNaDagen: 7 },
  { key: "geen_interesse", label: "Geen interesse", blijftOpLijst: false, followupNaDagen: null },
];

export function belUitkomstLabel(u: BelUitkomst | null | undefined): string {
  if (!u) return "Onbekend";
  return BEL_UITKOMSTEN.find((x) => x.key === u)?.label ?? u;
}

export function belUitkomstToon(
  u: BelUitkomst | null | undefined,
): "groen" | "amber" | "grijs" {
  if (u === "bereikt" || u === "afspraak") return "groen";
  if (u === "geen_interesse") return "grijs";
  return "amber";
}

export const ACTIVITEIT_TYPES: { key: ActiviteitType; label: string }[] = [
  { key: "notitie", label: "Notitie" },
  { key: "call", label: "Telefoon" },
  { key: "email", label: "E-mail" },
  { key: "follow_up", label: "Follow-up" },
  { key: "taak", label: "Taak" },
  { key: "systeem", label: "Systeem" },
];

export function activiteitTypeLabel(t: ActiviteitType): string {
  return ACTIVITEIT_TYPES.find((x) => x.key === t)?.label ?? t;
}

export function activiteitToon(t: ActiviteitType): "navy" | "oranje" | "grijs" {
  if (t === "follow_up") return "oranje";
  if (t === "systeem") return "grijs";
  return "navy";
}
