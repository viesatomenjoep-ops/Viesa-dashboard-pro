/** Types en metadata voor de koppelingen-module. */

export type IntegratieDienst =
  | "google_drive"
  | "google_sheets"
  | "google_docs"
  | "slack"
  | "gmail"
  | "outlook"
  | "claude_api"
  | "fonio";

export type IntegratieStatus = "niet_verbonden" | "verbonden" | "fout";

export type Integratie = {
  id: string;
  dienst: IntegratieDienst;
  status: IntegratieStatus;
  config: Record<string, unknown>;
  laatst_gecontroleerd_op: string | null;
  created_at: string;
  updated_at: string;
};

export const DIENSTEN: {
  key: IntegratieDienst;
  label: string;
  omschrijving: string;
}[] = [
  { key: "google_drive", label: "Google Drive", omschrijving: "Gescande bonnetjes & facturen automatisch in je Drive." },
  { key: "google_sheets", label: "Google Sheets", omschrijving: "Exports en overzichten." },
  { key: "google_docs", label: "Google Docs", omschrijving: "Documenten en sjablonen." },
  { key: "gmail", label: "Gmail", omschrijving: "Factuurherinneringen versturen." },
  { key: "outlook", label: "Outlook", omschrijving: "Alternatief mailkanaal." },
  { key: "slack", label: "Slack", omschrijving: "Notificaties (later)." },
  { key: "claude_api", label: "Claude API", omschrijving: "Openingszinnen en offerteteksten." },
  { key: "fonio", label: "Fonio", omschrijving: "AI-telefonie — democonsole op de bellijst." },
];

export function integratieStatusToon(
  s: IntegratieStatus,
): "groen" | "grijs" | "rood" {
  if (s === "verbonden") return "groen";
  if (s === "fout") return "rood";
  return "grijs";
}

export function integratieStatusLabel(s: IntegratieStatus): string {
  if (s === "verbonden") return "Verbonden";
  if (s === "fout") return "Fout";
  return "Niet verbonden";
}
