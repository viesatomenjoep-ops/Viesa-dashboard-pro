import "server-only";
import { BEDRIJF, adresRegel, logoAbsoluut } from "@/lib/bedrijf";
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
 * Briefhoofd bovenaan elke uitgaande e-mail: logo links, bedrijfsnaam en website
 * ernaast, afgesloten met een navy lijn. Tabel-opmaak (geen flexbox) omdat
 * Outlook geen moderne layout ondersteunt.
 */
export function mailBriefhoofd(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
    <tr>
      <td style="vertical-align:middle; padding:0 12px 14px 0; width:48px;">
        <img src="${logoAbsoluut()}" alt="${BEDRIJF.naam}" width="44" height="49" style="display:block; border:0;" />
      </td>
      <td style="vertical-align:middle; padding:0 0 14px;">
        <div style="font-size:17px; font-weight:bold; color:#19445B; letter-spacing:0.01em;">${BEDRIJF.naam}</div>
        <div style="font-size:12px; color:#7A8B99; padding-top:2px;">${BEDRIJF.website}</div>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border-top:2px solid #19445B; font-size:0; line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

/** Huisstijl-handtekening (naam + website + contact) voor onder e-mails. */
export function mailHandtekening(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr>
      <td style="vertical-align:middle; line-height:1.5;">
        <div style="font-weight:bold; color:#19445B; font-size:14px;">${BEDRIJF.naam}</div>
        <div style="color:#64748b; font-size:12px;">
          <a href="${BEDRIJF.websiteUrl}" style="color:#19445B; text-decoration:none;">${BEDRIJF.website}</a>
          &nbsp;·&nbsp; <a href="mailto:${BEDRIJF.email}" style="color:#64748b; text-decoration:none;">${BEDRIJF.email}</a>
        </div>
        <div style="color:#94a3b8; font-size:12px;">${BEDRIJF.telefoon}</div>
      </td>
    </tr>
  </table>`;
}

/** Kleine voettekst met NAW en btw-nummer — hoort bij zakelijke correspondentie. */
export function mailVoettekst(): string {
  return `
  <div style="margin-top:20px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:11px; line-height:1.6; color:#94a3b8;">
    ${BEDRIJF.naam} · ${adresRegel()} · btw ${BEDRIJF.btw}<br />
    ${BEDRIJF.contactpersonen.join(" · ")}
  </div>`;
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
 * met logo, titel, inhoud, handtekening en NAW-voettekst — alles in navy.
 *
 * `lettertype` is een sleutel uit `lib/lettertypes.ts`; de bijbehorende stack
 * wordt inline op de buitenste container gezet zodat alles binnenin hem erft.
 * Zonder waarde gebruiken we de zakelijke standaard (Georgia).
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
    <hr style="margin:28px 0; border:none; border-top:1px solid #e2e8f0;" />
    ${mailHandtekening()}
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
