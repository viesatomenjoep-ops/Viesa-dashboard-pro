import "server-only";
import { BEDRIJF, logoAbsoluut } from "@/lib/bedrijf";

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
};

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
      subject: m.onderwerp,
      html: m.html,
      text: m.tekst,
      reply_to: m.antwoordNaar,
    }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

/** Huisstijl-handtekening (logo + naam + website + contact) voor onder e-mails. */
export function mailHandtekening(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr>
      <td style="vertical-align:middle; padding-right:12px;">
        <img src="${logoAbsoluut()}" alt="${BEDRIJF.naam}" width="44" height="49" style="display:block;" />
      </td>
      <td style="vertical-align:middle; font-family:sans-serif; line-height:1.4;">
        <div style="font-weight:bold; color:#19445B; font-size:14px;">${BEDRIJF.naam}</div>
        <div style="color:#64748b; font-size:12px;">
          <a href="${BEDRIJF.websiteUrl}" style="color:#1E9E93; text-decoration:none;">${BEDRIJF.website}</a>
          &nbsp;·&nbsp; <a href="mailto:${BEDRIJF.email}" style="color:#64748b; text-decoration:none;">${BEDRIJF.email}</a>
        </div>
        <div style="color:#94a3b8; font-size:12px;">${BEDRIJF.telefoon}</div>
      </td>
    </tr>
  </table>`;
}

/** Eenvoudige, huisstijl-conforme HTML-wikkel voor een platte tekstboodschap. */
export function mailHtml(titel: string, tekst: string): string {
  const body = tekst.replace(/\n/g, "<br/>");
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h1 style="color:#19445B; font-size:22px; font-weight:bold; margin:0 0 16px; border-bottom:2px solid #1E9E93; padding-bottom:10px;">${titel}</h1>
    <div style="color:#1e293b; line-height:1.6; font-size:15px;">${body}</div>
    <hr style="margin:28px 0; border:none; border-top:1px solid #e2e8f0;" />
    ${mailHandtekening()}
  </div>`;
}
