/** Types en constanten voor Drive-links (bestanden-module). */

export type DriveLinkType = "drive" | "sheet" | "doc" | "map" | "pdf" | "overig";

export type DriveContextType =
  | "algemeen"
  | "lead"
  | "project"
  | "offerte"
  | "factuur";

export type DriveLink = {
  id: string;
  titel: string;
  url: string;
  type: DriveLinkType;
  context_type: DriveContextType;
  context_id: string | null;
  created_at: string;
  updated_at: string;
};

export const DRIVE_LINK_TYPES: { key: DriveLinkType; label: string }[] = [
  { key: "drive", label: "Drive" },
  { key: "sheet", label: "Sheet" },
  { key: "doc", label: "Doc" },
  { key: "map", label: "Map" },
  { key: "pdf", label: "PDF" },
  { key: "overig", label: "Overig" },
];

export function driveTypeLabel(t: DriveLinkType): string {
  return DRIVE_LINK_TYPES.find((x) => x.key === t)?.label ?? t;
}
