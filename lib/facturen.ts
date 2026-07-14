/** Types en constanten voor facturen. */

export type FactuurStatus =
  | "concept"
  | "verzonden"
  | "betaald"
  | "te_laat"
  | "geannuleerd";

export type Factuur = {
  id: string;
  nummer: string;
  klant_id: string | null;
  offerte_id: string | null;
  bedrag: number;
  btw_percentage: number;
  status: FactuurStatus;
  factuurdatum: string;
  vervaldatum: string | null;
  betaald_op: string | null;
  drive_pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Herinnering = {
  id: string;
  factuur_id: string;
  kanaal: "gmail" | "outlook";
  status: "gepland" | "verzonden" | "mislukt";
  bericht: string | null;
  verzonden_op: string | null;
  created_at: string;
};

export const FACTUUR_STATUSSEN: { key: FactuurStatus; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "verzonden", label: "Verzonden" },
  { key: "betaald", label: "Betaald" },
  { key: "te_laat", label: "Te laat" },
  { key: "geannuleerd", label: "Geannuleerd" },
];

export function factuurStatusToon(
  s: FactuurStatus,
): "grijs" | "navy" | "groen" | "rood" {
  switch (s) {
    case "concept":
      return "grijs";
    case "verzonden":
      return "navy";
    case "betaald":
      return "groen";
    case "te_laat":
      return "rood";
    case "geannuleerd":
      return "grijs";
  }
}

/** Totaalbedrag inclusief btw. */
export function inclBtw(bedrag: number, btwPercentage: number): number {
  return bedrag * (1 + (btwPercentage || 0) / 100);
}
