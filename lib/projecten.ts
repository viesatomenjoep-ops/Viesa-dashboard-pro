/** Types en constanten voor projecten & notities (canoniek datamodel). */

export type ProjectStatus = "actief" | "on_hold" | "afgerond";

export type Project = {
  id: string;
  naam: string;
  omschrijving: string | null;
  klant: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type Notitie = {
  id: string;
  project_id: string | null;
  lead_id: string | null;
  titel: string;
  inhoud_markdown: string;
  created_at: string;
  updated_at: string;
};

export const PROJECT_STATUSSEN: { key: ProjectStatus; label: string }[] = [
  { key: "actief", label: "Actief" },
  { key: "on_hold", label: "On hold" },
  { key: "afgerond", label: "Afgerond" },
];

export function projectStatusToon(
  s: ProjectStatus,
): "groen" | "oranje" | "grijs" {
  if (s === "actief") return "groen";
  if (s === "on_hold") return "oranje";
  return "grijs";
}
