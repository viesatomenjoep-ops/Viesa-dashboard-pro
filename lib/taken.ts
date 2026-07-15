/** Types en keuzelijsten voor to-do's (taken). */

export type TaakWie = "tom" | "joep" | "algemeen";
export type TaakPeriode = "week" | "maand" | "jaar";

export type Taak = {
  id: string;
  wie: TaakWie;
  titel: string;
  klaar: boolean;
  periode: TaakPeriode;
  deadline: string | null;
  klant_id: string | null;
  lead_id: string | null;
  klant_naam?: string | null;
  created_at: string;
};

export const TAAK_PERSONEN: { key: TaakWie; label: string }[] = [
  { key: "tom", label: "Tom" },
  { key: "joep", label: "Joep" },
  { key: "algemeen", label: "Algemeen" },
];

export const TAAK_PERIODES: { key: TaakPeriode; label: string }[] = [
  { key: "week", label: "Deze week" },
  { key: "maand", label: "Deze maand" },
  { key: "jaar", label: "Dit jaar" },
];

export function persoonLabel(w: TaakWie): string {
  return TAAK_PERSONEN.find((p) => p.key === w)?.label ?? w;
}
