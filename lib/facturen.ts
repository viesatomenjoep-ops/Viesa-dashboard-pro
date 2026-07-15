/** Types en constanten voor facturen (canoniek datamodel). */

export type FactuurStatus = "concept" | "open" | "betaald" | "vervallen";

export type Factuur = {
  id: string;
  lead_id: string | null;
  offerte_id: string | null;
  klant: string | null;
  nummer: string;
  bedrag: number;
  btw_percentage: number;
  status: FactuurStatus;
  factuurdatum: string;
  vervaldatum: string | null;
  betaald_op: string | null;
  herinnering_verstuurd_op: string | null;
  drive_pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Aantal dagen dat een openstaande factuur over de vervaldatum is (of null). */
export function dagenTeLaat(f: Factuur): number | null {
  if (!f.vervaldatum || f.status === "betaald" || f.status === "concept") return null;
  const d = (Date.now() - new Date(f.vervaldatum).getTime()) / 86_400_000;
  return d > 0 ? Math.floor(d) : null;
}

export const FACTUUR_STATUSSEN: { key: FactuurStatus; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "open", label: "Open" },
  { key: "betaald", label: "Betaald" },
  { key: "vervallen", label: "Vervallen" },
];

export function factuurStatusToon(
  s: FactuurStatus,
): "navy" | "groen" | "rood" | "grijs" {
  if (s === "betaald") return "groen";
  if (s === "vervallen") return "rood";
  if (s === "concept") return "grijs";
  return "navy";
}

export function factuurStatusLabel(s: FactuurStatus): string {
  return FACTUUR_STATUSSEN.find((x) => x.key === s)?.label ?? s;
}

/** Totaalbedrag inclusief btw. */
export function inclBtw(bedrag: number, btwPercentage: number): number {
  return bedrag * (1 + (btwPercentage || 0) / 100);
}

/** Betaaltermijn in dagen (betaald_op − factuurdatum), of null. */
export function betaaltermijnDagen(f: Factuur): number | null {
  if (!f.betaald_op) return null;
  const d =
    (new Date(f.betaald_op).getTime() - new Date(f.factuurdatum).getTime()) /
    86400000;
  return Math.max(0, Math.round(d));
}
