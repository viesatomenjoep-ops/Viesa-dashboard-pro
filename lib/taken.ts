/** Types en keuzelijsten voor to-do's (taken). */

export type TaakWie = "tom" | "joep" | "algemeen";
export type TaakPeriode = "week" | "maand" | "jaar";
export type TaakStatus = "todo" | "bezig" | "review" | "klaar";
export type TaakPrioriteit = "laag" | "normaal" | "hoog";

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
  // 0029: kanban
  status: TaakStatus;
  prioriteit: TaakPrioriteit;
  tags: string[];
  positie: number;
  created_at: string;
};

export const TAAK_STATUSSEN: { key: TaakStatus; label: string }[] = [
  { key: "todo", label: "Te doen" },
  { key: "bezig", label: "Bezig" },
  { key: "review", label: "Review" },
  { key: "klaar", label: "Klaar" },
];

export const TAAK_PRIORITEITEN: { key: TaakPrioriteit; label: string }[] = [
  { key: "hoog", label: "Hoog" },
  { key: "normaal", label: "Normaal" },
  { key: "laag", label: "Laag" },
];

/** Kleur voor een prioriteitspil op een kanban-kaart. */
export function prioriteitToon(p: TaakPrioriteit): "rood" | "blauw" | "grijs" {
  if (p === "hoog") return "rood";
  if (p === "normaal") return "blauw";
  return "grijs";
}

export function prioriteitLabel(p: TaakPrioriteit): string {
  return TAAK_PRIORITEITEN.find((x) => x.key === p)?.label ?? p;
}

export const TAAK_PERSONEN: { key: TaakWie; label: string }[] = [
  { key: "tom", label: "Tom" },
  { key: "joep", label: "Joep" },
  { key: "algemeen", label: "Team Viesa" },
];

export const TAAK_PERIODES: { key: TaakPeriode; label: string }[] = [
  { key: "week", label: "Deze week" },
  { key: "maand", label: "Deze maand" },
  { key: "jaar", label: "Dit jaar" },
];

export function persoonLabel(w: TaakWie): string {
  return TAAK_PERSONEN.find((p) => p.key === w)?.label ?? w;
}
