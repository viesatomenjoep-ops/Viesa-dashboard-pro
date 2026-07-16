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

/** Scandatum (YYYY-MM-DD) in de Nederlandse tijdzone — voor filteren op dag/maand/jaar. */
export function scanDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/**
 * Bouwt het periode-voorvoegsel uit de filtervelden: dag wint van maand, maand
 * van jaar. Resultaat is "2026-07-16", "2026-07", "2026" of "" (alles).
 */
export function periodePrefix(f: { dag?: string; maand?: string; jaar?: string }): string {
  if (f.dag?.trim()) return f.dag.trim();
  if (f.maand?.trim()) return f.maand.trim();
  if (f.jaar?.trim()) return f.jaar.trim();
  return "";
}

/** Filtert scans op type en periode (op basis van de automatische scandatum). */
export function filterScans<T extends { type: AdminType; created_at: string }>(
  scans: T[],
  type: string,
  periode: string,
): T[] {
  return scans.filter((s) => {
    if (type && s.type !== type) return false;
    if (periode && !scanDatum(s.created_at).startsWith(periode)) return false;
    return true;
  });
}
