/** Types en constanten voor auditverslagen. */

export type AuditStatus = "concept" | "afgerond";

export type Audit = {
  id: string;
  klant_id: string | null;
  lead_id: string | null;
  nummer: string;
  titel: string;
  status: AuditStatus;
  inhoud_markdown: string;
  created_at: string;
  updated_at: string;
};

export const AUDIT_STATUSSEN: { key: AuditStatus; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "afgerond", label: "Afgerond" },
];

export function auditStatusToon(s: AuditStatus): "grijs" | "groen" {
  return s === "afgerond" ? "groen" : "grijs";
}

/** Standaard-sjabloon voor een nieuw auditverslag (huisstijl-structuur). */
export const AUDIT_SJABLOON = `## Samenvatting

Korte samenvatting van de bevindingen.

## Huidige situatie

- ...

## Knelpunten & kansen

- ...

## Aanbevelingen

1. ...
2. ...

## Verwachte impact

- Tijdsbesparing: ...
- Kosten: ...
`;
