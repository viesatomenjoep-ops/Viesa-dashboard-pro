/** Types en constanten voor de takenmodule. */

export type TaakStatus = "open" | "afgerond";
export type TaakPrioriteit = "laag" | "normaal" | "hoog";

export type Taak = {
  id: string;
  titel: string;
  omschrijving: string | null;
  vervaldatum: string | null;
  status: TaakStatus;
  prioriteit: TaakPrioriteit;
  lead_id: string | null;
  project_id: string | null;
  afgerond_op: string | null;
  created_at: string;
  updated_at: string;
};

export const PRIORITEITEN: { key: TaakPrioriteit; label: string }[] = [
  { key: "laag", label: "Laag" },
  { key: "normaal", label: "Normaal" },
  { key: "hoog", label: "Hoog" },
];

export function prioriteitToon(p: TaakPrioriteit): "grijs" | "navy" | "oranje" {
  if (p === "hoog") return "oranje";
  if (p === "normaal") return "navy";
  return "grijs";
}

/** True als de taak vandaag of eerder vervalt en nog open is. */
export function isVandaagOfAchterstallig(taak: Taak): boolean {
  if (taak.status !== "open" || !taak.vervaldatum) return false;
  const vandaag = new Date();
  vandaag.setHours(23, 59, 59, 999);
  return new Date(taak.vervaldatum) <= vandaag;
}
