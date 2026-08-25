/** Types en helpers voor sjablonen (template-machine, migratie 0032). */
import { MAIL_TEMPLATES } from "@/lib/mailtemplates";
import { OUTREACH_TEMPLATES } from "@/lib/mailtemplates-outreach";
import { BELSCRIPTS } from "@/lib/belscripts";
import { STANDAARD_LETTERTYPE } from "@/lib/lettertypes";

export type SjabloonType = "email" | "offerte" | "audit" | "belscript";

export type Sjabloon = {
  id: string;
  type: SjabloonType;
  naam: string;
  /** E-mail: de onderwerpregel. Belscript: het doel van het gesprek. */
  onderwerp: string | null;
  inhoud_html: string;
  /** Sleutel uit lib/lettertypes.ts; leeg = de standaard (migratie 0041). */
  lettertype?: string | null;
  created_at: string;
  updated_at: string;
};

export const SJABLOON_TYPES: { key: SjabloonType; label: string }[] = [
  { key: "email", label: "E-mail" },
  { key: "belscript", label: "Belscript" },
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
 * ingebouwde e-mailsjablonen, de 25 outreach-sjablonen, de 25 belscripts en een
 * audit- en offerte-start. Idempotent inzetbaar (de import slaat bestaande
 * naam+type over).
 */
export function standaardSjablonen(): {
  type: SjabloonType;
  naam: string;
  onderwerp: string | null;
  inhoud_html: string;
  lettertype: string | null;
}[] {
  const naarVariabelen = (s: string) =>
    s.replace(/\[bedrijf\]/gi, "{{bedrijf}}").replace(/\[naam\]/gi, "{{voornaam}}");

  const email = MAIL_TEMPLATES.filter((t) => t.key !== "leeg").map((t) => ({
    type: "email" as const,
    naam: t.naam,
    onderwerp: naarVariabelen(t.onderwerp),
    inhoud_html: tekstNaarHtml(t.tekst),
    lettertype: STANDAARD_LETTERTYPE,
  }));

  // De 25 outreach-sjablonen schrijven hun variabelen al als {{...}}.
  const outreach = OUTREACH_TEMPLATES.map((t) => ({
    type: "email" as const,
    naam: t.naam,
    onderwerp: t.onderwerp,
    inhoud_html: tekstNaarHtml(t.tekst),
    lettertype: STANDAARD_LETTERTYPE,
  }));

  const belscripts = BELSCRIPTS.map((s) => ({
    type: "belscript" as const,
    naam: s.naam,
    onderwerp: s.doel,
    inhoud_html: tekstNaarHtml(s.tekst),
    lettertype: null,
  }));

  return [
    ...email,
    ...outreach,
    ...belscripts,
    {
      type: "audit",
      naam: "Standaard auditverslag",
      onderwerp: null,
      inhoud_html: AUDIT_START_HTML,
      lettertype: null,
    },
    {
      type: "offerte",
      naam: "Standaard offerte",
      onderwerp: null,
      inhoud_html: OFFERTE_START_HTML,
      lettertype: null,
    },
  ];
}
