/** Types en helpers voor sjablonen (template-machine, migratie 0032). */
import { MAIL_TEMPLATES } from "@/lib/mailtemplates";

export type SjabloonType = "email" | "offerte" | "audit";

export type Sjabloon = {
  id: string;
  type: SjabloonType;
  naam: string;
  onderwerp: string | null;
  inhoud_html: string;
  created_at: string;
  updated_at: string;
};

export const SJABLOON_TYPES: { key: SjabloonType; label: string }[] = [
  { key: "email", label: "E-mail" },
  { key: "offerte", label: "Offerte" },
  { key: "audit", label: "Audit" },
];

export function sjabloonTypeLabel(t: SjabloonType): string {
  return SJABLOON_TYPES.find((x) => x.key === t)?.label ?? t;
}

/**
 * Zet platte sjabloontekst (met [naam]/[bedrijf]/[website] en •-bullets) om naar
 * nette HTML met {{variabelen}}, voor de import van de standaard-e-mailsjablonen.
 */
export function tekstNaarHtml(tekst: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const vars = (s: string) =>
    s
      .replace(/\[naam\]/gi, "{{voornaam}}")
      .replace(/\[bedrijf\]/gi, "{{bedrijf}}")
      .replace(/\[website\]/gi, "{{website}}");

  return tekst
    .split(/\n\n+/)
    .map((blok) => {
      const regels = blok.split("\n");
      if (regels.length > 1 && regels.every((r) => r.trim().startsWith("•"))) {
        const items = regels
          .map((r) => `<li>${vars(esc(r.replace(/^\s*•\s*/, "")))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${vars(esc(blok)).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

/** HTML-startsjabloon voor een auditverslag. */
export const AUDIT_START_HTML = `<h2>Samenvatting</h2>
<p>Korte samenvatting van de bevindingen voor {{bedrijf}}.</p>
<h2>Huidige situatie</h2>
<ul><li>…</li></ul>
<h2>Knelpunten &amp; kansen</h2>
<ul><li>…</li></ul>
<h2>Aanbevelingen</h2>
<ol><li>…</li></ol>
<h2>Verwachte impact</h2>
<ul><li>Tijdsbesparing: …</li><li>Kosten: …</li></ul>`;

/** HTML-startsjabloon voor een offerte. */
export const OFFERTE_START_HTML = `<p>Beste {{voornaam}},</p>
<p>Naar aanleiding van ons contact ontvang je hierbij onze offerte voor {{bedrijf}}.</p>
<h2>Voorgestelde werkzaamheden</h2>
<ul><li>Onderdeel — prijsindicatie</li></ul>
<h2>Investering</h2>
<p>Totaal: —</p>
<p>Met vriendelijke groet,<br>Tom &amp; Joep — Viesa Automations</p>`;

/**
 * De standaardsjablonen om (eenmalig) te importeren in de database: de
 * ingebouwde e-mailsjablonen + een audit- en offerte-start. Idempotent inzetbaar
 * (de import slaat bestaande naam+type over).
 */
export function standaardSjablonen(): {
  type: SjabloonType;
  naam: string;
  onderwerp: string | null;
  inhoud_html: string;
}[] {
  const email = MAIL_TEMPLATES.filter((t) => t.key !== "leeg").map((t) => ({
    type: "email" as const,
    naam: t.naam,
    onderwerp: t.onderwerp
      .replace(/\[bedrijf\]/gi, "{{bedrijf}}")
      .replace(/\[naam\]/gi, "{{voornaam}}"),
    inhoud_html: tekstNaarHtml(t.tekst),
  }));
  return [
    ...email,
    { type: "audit", naam: "Standaard auditverslag", onderwerp: null, inhoud_html: AUDIT_START_HTML },
    { type: "offerte", naam: "Standaard offerte", onderwerp: null, inhoud_html: OFFERTE_START_HTML },
  ];
}
