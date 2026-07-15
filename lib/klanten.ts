/** Types en keuzelijsten voor het klantenbestand. */

export type KlantType =
  | "prospect"
  | "klant"
  | "partner"
  | "hot_lead"
  | "cold_lead";

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
  logo_url: string | null;
  notities: string | null;
  created_at: string;
  updated_at: string;
};

export const KLANT_TYPES: { key: KlantType; label: string }[] = [
  { key: "hot_lead", label: "Hot lead" },
  { key: "cold_lead", label: "Cold lead" },
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

export const LANDEN = ["Nederland", "België", "Duitsland", "Overig"] as const;

/** Regio's (provincies/deelstaten) per land. */
export const REGIOS_PER_LAND: Record<string, string[]> = {
  Nederland: [
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
  ],
  België: [
    "Antwerpen",
    "Oost-Vlaanderen",
    "West-Vlaanderen",
    "Vlaams-Brabant",
    "Limburg (BE)",
    "Henegouwen",
    "Luik",
    "Luxemburg (BE)",
    "Namen",
    "Waals-Brabant",
    "Brussel",
  ],
  Duitsland: [
    "Baden-Württemberg",
    "Beieren",
    "Berlijn",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hessen",
    "Mecklenburg-Voor-Pommeren",
    "Nedersaksen",
    "Noordrijn-Westfalen",
    "Rijnland-Palts",
    "Saarland",
    "Saksen",
    "Saksen-Anhalt",
    "Sleeswijk-Holstein",
    "Thüringen",
  ],
  Overig: ["Internationaal"],
};

/** Platte lijst met alle regio's (voor filters e.d.). */
export const REGIOS: string[] = Array.from(
  new Set(Object.values(REGIOS_PER_LAND).flat()),
);

export function klantTypeToon(
  t: KlantType,
): "groen" | "navy" | "oranje" | "grijs" {
  if (t === "klant") return "groen";
  if (t === "partner" || t === "hot_lead") return "oranje";
  if (t === "cold_lead") return "grijs";
  return "navy";
}

export function klantTypeLabel(t: KlantType): string {
  return KLANT_TYPES.find((x) => x.key === t)?.label ?? t;
}

/** Korte afkorting van het type (voor smalle schermen). */
export function klantTypeKort(t: KlantType): string {
  const kort: Record<KlantType, string> = {
    hot_lead: "Hot",
    cold_lead: "Cold",
    prospect: "Prosp.",
    klant: "Klant",
    partner: "Part.",
  };
  return kort[t] ?? t;
}
