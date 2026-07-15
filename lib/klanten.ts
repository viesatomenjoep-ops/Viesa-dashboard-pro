/** Types en keuzelijsten voor het klantenbestand. */

export type KlantType = "prospect" | "klant" | "partner";

export type Klant = {
  id: string;
  bedrijf: string;
  contact_naam: string | null;
  email: string | null;
  telefoon: string | null;
  website: string | null;
  straat: string | null;
  postcode: string | null;
  stad: string | null;
  regio: string | null;
  land: string;
  branche: string | null;
  type: KlantType;
  notities: string | null;
  created_at: string;
  updated_at: string;
};

export const KLANT_TYPES: { key: KlantType; label: string }[] = [
  { key: "prospect", label: "Prospect" },
  { key: "klant", label: "Klant" },
  { key: "partner", label: "Partner" },
];

/** Branches/niches (uitbreidbaar). */
export const BRANCHES = [
  "Webshop / e-commerce",
  "Retail",
  "Horeca",
  "Bouw & installatie",
  "Zorg & welzijn",
  "Zakelijke dienstverlening",
  "Productie & industrie",
  "Automotive",
  "Vastgoed & makelaardij",
  "Onderwijs",
  "Transport & logistiek",
  "ICT & software",
  "Overig",
] as const;

/** Nederlandse provincies + internationaal. */
export const REGIOS = [
  "Groningen",
  "Friesland",
  "Drenthe",
  "Overijssel",
  "Flevoland",
  "Gelderland",
  "Utrecht",
  "Noord-Holland",
  "Zuid-Holland",
  "Zeeland",
  "Noord-Brabant",
  "Limburg",
  "Internationaal",
] as const;

export const LANDEN = ["Nederland", "België", "Duitsland", "Overig"] as const;

export function klantTypeToon(t: KlantType): "groen" | "navy" | "oranje" {
  if (t === "klant") return "groen";
  if (t === "partner") return "oranje";
  return "navy";
}

export function klantTypeLabel(t: KlantType): string {
  return KLANT_TYPES.find((x) => x.key === t)?.label ?? t;
}
