/** Types en constanten voor activiteiten (log + follow-ups). */

export type ActiviteitType =
  | "notitie"
  | "call"
  | "email"
  | "follow_up"
  | "taak"
  | "systeem";

export type ActiviteitStatus = "open" | "afgerond";

export type Activiteit = {
  id: string;
  lead_id: string | null;
  type: ActiviteitType;
  titel: string | null;
  omschrijving: string | null;
  status: ActiviteitStatus;
  follow_up_datum: string | null;
  afgerond_op: string | null;
  created_at: string;
  updated_at: string;
};

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
