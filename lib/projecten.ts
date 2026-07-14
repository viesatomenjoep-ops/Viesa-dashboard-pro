/** Types en constanten voor projecten. */

export type ProjectStatus = "actief" | "on_hold" | "afgerond";

export type Project = {
  id: string;
  naam: string;
  omschrijving: string | null;
  status: ProjectStatus;
  klant_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectNotitie = {
  id: string;
  project_id: string;
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
