/** Types en constanten voor offertes (canoniek datamodel). */

export type OfferteStatus =
  | "concept"
  | "verzonden"
  | "opvolgen"
  | "geaccepteerd"
  | "afgewezen";

export type Offerte = {
  id: string;
  lead_id: string | null;
  klant_id: string | null;
  klant: string | null;
  nummer: string;
  titel: string;
  inhoud_markdown: string;
  bedrag: number;
  status: OfferteStatus;
  logo_url: string | null;
  drive_pdf_url: string | null;
  verzonden_op: string | null;
  created_at: string;
  updated_at: string;
};

export const OFFERTE_STATUSSEN: { key: OfferteStatus; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "verzonden", label: "Verzonden" },
  { key: "opvolgen", label: "Opvolgen" },
  { key: "geaccepteerd", label: "Geaccepteerd" },
  { key: "afgewezen", label: "Afgewezen" },
];

/** Offertes die nog "lopen" (niet definitief). */
export const LOPENDE_OFFERTE_STATUS: OfferteStatus[] = [
  "concept",
  "verzonden",
  "opvolgen",
];

export function offerteStatusToon(
  s: OfferteStatus,
): "grijs" | "navy" | "oranje" | "groen" | "rood" {
  switch (s) {
    case "concept":
      return "grijs";
    case "verzonden":
      return "navy";
    case "opvolgen":
      return "oranje";
    case "geaccepteerd":
      return "groen";
    case "afgewezen":
      return "rood";
  }
}

export function offerteStatusLabel(s: OfferteStatus): string {
  return OFFERTE_STATUSSEN.find((x) => x.key === s)?.label ?? s;
}
