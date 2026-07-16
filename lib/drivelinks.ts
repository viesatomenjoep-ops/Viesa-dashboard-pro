/** Types en constanten voor Drive-links (bestanden-module). */

export type DriveLinkType =
  | "drive"
  | "sheet"
  | "doc"
  | "map"
  | "pdf"
  | "icloud"
  | "overig";

export type DriveContextType =
  | "algemeen"
  | "lead"
  | "project"
  | "offerte"
  | "factuur"
  | "klant";

export type DriveLink = {
  id: string;
  titel: string;
  url: string;
  type: DriveLinkType;
  context_type: DriveContextType;
  context_id: string | null;
  categorie: string | null;
  // 0035: geüploade bestanden staan in Google Drive.
  drive_file_id: string | null;
  mime: string | null;
  created_at: string;
  updated_at: string;
};

/** Standaard-categorieën voor de Bestanden-pagina (altijd beschikbaar). */
export const STANDAARD_CATEGORIEEN = [
  "Websites Viesa Automations",
  "Offertes",
  "Facturen",
  "Leadlijsten",
  "Excel-bestanden",
  "Overige bestanden",
] as const;

export const DRIVE_LINK_TYPES: { key: DriveLinkType; label: string }[] = [
  { key: "drive", label: "Drive" },
  { key: "sheet", label: "Sheet" },
  { key: "doc", label: "Doc" },
  { key: "map", label: "Map" },
  { key: "pdf", label: "PDF" },
  { key: "icloud", label: "iCloud" },
  { key: "overig", label: "Overig" },
];

export function driveTypeLabel(t: DriveLinkType): string {
  return DRIVE_LINK_TYPES.find((x) => x.key === t)?.label ?? t;
}
