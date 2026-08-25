import "server-only";
import { BEDRIJF, adresRegel, logoAbsoluut, logoAnimatieAbsoluut } from "@/lib/bedrijf";
import { lettertypeStack } from "@/lib/lettertypes";

/**
 * Resend-e-mail (server-only). Verstuurt namens contact@viesa-automations.nl.
 * Vereist env: RESEND_API_KEY. De sleutel bereikt nooit de browser.
 */

const AFZENDER = `${BEDRIJF.naam} <${BEDRIJF.email}>`;

export function resendGeconfigureerd(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type MailInvoer = {
  naar: string | string[];
  onderwerp: string;
  html: string;
  tekst?: string;
  antwoordNaar?: string;
  van?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

/** Splitst een komma-/puntkomma-gescheiden adressenreeks in een lijst. */
function adressen(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  const lijst = Array.isArray(v)
    ? v
    : v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return lijst.length ? lijst : undefined;
}

export async function verstuurMail(m: MailInvoer): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY ontbreekt (zet 'm in Vercel/.env.local).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: m.van ?? AFZENDER,
      to: m.naar,
      cc: adressen(m.cc),
      bcc: adressen(m.bcc),
      subject: m.onderwerp,
      html: m.html,
      text: m.tekst,
      reply_to: m.antwoordNaar,
    }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

/**
 * Briefhoofd bovenaan elke uitgaande e-mail: het logo met daarnaast
 * "Viesa Automations", allebei klikbaar naar de website. Bewust géén
 * zichtbare URL — het adres en de contactgegevens staan onderaan.
 *
 * Tabel-opmaak (geen flexbox) omdat Outlook geen moderne layout ondersteunt.
 * De <a> zit óm het logo én om de naam, zodat de hele kop doorverwijst.
 */
export function mailBriefhoofd(): string {
  return `
  ${mailAnimatie()}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
    <tr>
      <td class="viesa-logo" style="vertical-align:middle; padding:0 12px 14px 0; width:48px;">
        <a href="${BEDRIJF.websiteUrl}" style="text-decoration:none; border:0;">
          <img src="${logoAnimatieAbsoluut()}" alt="" width="44" height="49" style="display:block; border:0;" />
        </a>
      </td>
      <td class="viesa-naam" style="vertical-align:middle; padding:0 0 14px;">
        <a href="${BEDRIJF.websiteUrl}" style="font-size:17px; font-weight:bold; color:#19445B; letter-spacing:0.01em; text-decoration:none;">${BEDRIJF.naam}</a>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border-top:2px solid #19445B; font-size:0; line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

/**
 * Animatie voor het briefhoofd: logo en naam schuiven bij het openen van de
 * mail zachtjes open.
 *
 * Progressive enhancement, en dat is hier geen detail maar de kern. De
 * elementen staan van zichzelf in hun eindtoestand (zichtbaar, op hun plek);
 * de animatie speelt daar alleen overheen. Strippen Gmail of Outlook de
 * keyframes — en dat doen ze — dan ziet de ontvanger gewoon een net,
 * stilstaand briefhoofd in plaats van een leeg vlak.
 *
 * Waar het écht speelt: Apple Mail op Mac en iPhone. Gmail en Outlook laten
 * animaties niet toe; voor die clients is een geanimeerde GIF de enige weg.
 *
 * `prefers-reduced-motion` wordt gerespecteerd — wie beweging heeft uitgezet,
 * krijgt het stilstaande briefhoofd.
 */
function mailAnimatie(): string {
  return `<style>
    @keyframes viesaOpenslaan {
      from { opacity: 0; transform: translateX(-14px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .viesa-logo { animation: viesaOpenslaan 0.6s ease-out both; }
    .viesa-naam { animation: viesaOpenslaan 0.6s ease-out 0.18s both; }
    @media (prefers-reduced-motion: reduce) {
      .viesa-logo, .viesa-naam { animation: none; }
    }
  </style>`;
}

/**
 * Alles wat onderaan de mail hoort: logo, bedrijfsnaam, adres, contactgegevens
 * en btw-nummer. Logo en naam verwijzen door naar de website, net als bovenaan.
 */
export function mailVoettekst(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px; border-top:1px solid #e2e8f0;">
    <tr>
      <td style="vertical-align:top; padding:16px 12px 0 0; width:48px;">
        <a href="${BEDRIJF.websiteUrl}" style="text-decoration:none; border:0;">
          <img src="${logoAbsoluut()}" alt="" width="40" height="45" style="display:block; border:0;" />
        </a>
      </td>
      <td style="vertical-align:top; padding:16px 0 0; line-height:1.6;">
        <div>
          <a href="${BEDRIJF.websiteUrl}" style="font-weight:bold; color:#19445B; font-size:14px; text-decoration:none;">${BEDRIJF.naam}</a>
        </div>
        <div style="color:#64748b; font-size:12px;">${adresRegel()}</div>
        <div style="color:#64748b; font-size:12px;">
          <a href="mailto:${BEDRIJF.email}" style="color:#64748b; text-decoration:none;">${BEDRIJF.email}</a>
          &nbsp;·&nbsp; ${BEDRIJF.telefoon}
        </div>
        <div style="color:#94a3b8; font-size:11px; padding-top:4px;">
          btw ${BEDRIJF.btw} · ${BEDRIJF.contactpersonen.join(" · ")}
        </div>
      </td>
    </tr>
  </table>`;
}

/**
 * Lichte server-side sanitatie van door de gebruiker opgemaakte HTML: verwijdert
 * script/style/iframe-achtige tags, inline event-handlers (onclick e.d.) en
 * javascript:-URLs. Best effort — de rich-editor produceert alleen simpele
 * opmaak; dit dekt geplakte of gemanipuleerde inhoud af.
 */
export function saniteerHtml(html: string): string {
  return html
    .replace(
      /<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, "")
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

/**
 * Huisstijl-conforme HTML-wikkel om een reeds-opgemaakte HTML-body: briefhoofd
 * met het geanimeerde logo, de titel, de inhoud, en onderaan het logo met adres
 * en contactgegevens — alles in navy.
 *
 * `lettertype` is een sleutel uit `lib/lettertypes.ts`; de bijbehorende stack
 * wordt inline op de buitenste container gezet zodat alles binnenin hem erft.
 * Zonder waarde gebruiken we de zakelijke standaard (Times New Roman).
 */
export function mailHtmlRijk(
  titel: string,
  bodyHtml: string,
  lettertype?: string | null,
): string {
  const font = lettertypeStack(lettertype);
  return `
  <div style="font-family: ${font}; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
    ${mailBriefhoofd()}
    <h1 style="color:#19445B; font-size:22px; font-weight:bold; margin:0 0 16px;">${titel}</h1>
    <div style="color:#1e293b; line-height:1.6; font-size:15px;">${bodyHtml}</div>
    ${mailVoettekst()}
  </div>`;
}

/** Eenvoudige, huisstijl-conforme HTML-wikkel voor een platte tekstboodschap. */
export function mailHtml(
  titel: string,
  tekst: string,
  lettertype?: string | null,
): string {
  return mailHtmlRijk(titel, tekst.replace(/\n/g, "<br/>"), lettertype);
}
