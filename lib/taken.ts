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

/**
 * Vaste kleur per persoon, zodat je in één oogopslag ziet van wie een taak is:
 * Tom = blauw, Joep = oranje, Team Viesa = rood. `stip` voor een bolletje,
 * `tekst` voor het label, `zacht` voor een gekleurde pil, `rand` voor een randje.
 */
export function persoonKleur(w: TaakWie): {
  stip: string;
  tekst: string;
  zacht: string;
  rand: string;
} {
  switch (w) {
    case "tom":
      return { stip: "bg-blue-500", tekst: "text-blue-600", zacht: "bg-blue-100 text-blue-700", rand: "border-blue-500" };
    case "joep":
      return { stip: "bg-orange-500", tekst: "text-orange-600", zacht: "bg-orange-100 text-orange-700", rand: "border-orange-500" };
    default:
      return { stip: "bg-red-500", tekst: "text-red-600", zacht: "bg-red-100 text-red-700", rand: "border-red-500" };
  }
}
