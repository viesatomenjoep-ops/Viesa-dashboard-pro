/** Types en constanten voor offertes. */

export type OfferteStatus =
  | "concept"
  | "verzonden"
  | "opvolgen"
  | "geaccepteerd"
  | "afgewezen";

export type Offerte = {
  id: string;
  nummer: string;
  klant_id: string | null;
  lead_id: string | null;
  template_id: string | null;
  titel: string;
  inhoud_markdown: string;
  notities: string | null;
  bedrag: number;
  status: OfferteStatus;
  drive_pdf_url: string | null;
  verzonden_op: string | null;
  created_at: string;
  updated_at: string;
};

export type OfferteTemplate = {
  id: string;
  naam: string;
  inhoud_markdown: string;
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

/** Vult {{placeholders}} in een template met bekende waarden. */
export function vulTemplate(
  template: string,
  waarden: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, sleutel) =>
    sleutel in waarden ? waarden[sleutel] : `{{${sleutel}}}`,
  );
}
