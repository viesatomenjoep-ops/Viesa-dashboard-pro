/** Types en helpers voor de administratie (gescande bonnetjes/facturen). */

export type AdminType = "bonnetje" | "factuur" | "bestelling" | "overig";

export type AdministratieItem = {
  id: string;
  type: AdminType;
  omschrijving: string | null;
  bedrag: number | null;
  storage_pad: string | null;
  mime: string | null;
  grootte: number | null;
  drive_url: string | null;
  drive_file_id: string | null;
  created_at: string;
  // Alleen in de UI: tijdelijke (signed) bekijk-URL uit de private bucket.
  bekijk_url?: string | null;
};

export const ADMIN_TYPES: { key: AdminType; label: string }[] = [
  { key: "bonnetje", label: "Bonnetje" },
  { key: "factuur", label: "Factuur" },
  { key: "bestelling", label: "Bestelling" },
  { key: "overig", label: "Overig" },
];

export function adminTypeLabel(t: AdminType): string {
  return ADMIN_TYPES.find((x) => x.key === t)?.label ?? t;
}

export function adminTypeToon(t: AdminType): "blauw" | "paars" | "amber" | "grijs" {
  if (t === "bonnetje") return "blauw";
  if (t === "factuur") return "paars";
  if (t === "bestelling") return "amber";
  return "grijs";
}
