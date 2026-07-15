import "server-only";
import crypto from "crypto";

/**
 * Ontvangen e-mail via Resend (server-only). De inbound-webhook stuurt alleen
 * metadata mee; de volledige inhoud en bijlagen halen we hier op via de Resend
 * "receiving"-API. Bevat ook de Svix-handtekeningverificatie voor de webhook.
 */

const API = "https://api.resend.com";

function sleutel(): string {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error("RESEND_API_KEY ontbreekt.");
  return k;
}

export type OntvangenEmail = {
  id: string;
  from: string | null;
  to?: string[] | string | null;
  cc?: string[] | string | null;
  bcc?: string[] | string | null;
  subject?: string | null;
  html?: string | null;
  text?: string | null;
  message_id?: string | null;
  headers?: Record<string, string> | { name: string; value: string }[] | null;
  attachments?: { id: string; filename?: string; content_type?: string; content_id?: string }[];
};

export type OntvangenBijlage = {
  id: string;
  filename?: string | null;
  size?: number | null;
  content_type?: string | null;
  content_disposition?: string | null;
  content_id?: string | null;
  download_url?: string | null;
};

/** Haalt de volledige inhoud van een ontvangen e-mail op. */
export async function haalOntvangenEmail(id: string): Promise<OntvangenEmail> {
  const res = await fetch(`${API}/emails/receiving/${id}`, {
    headers: { Authorization: `Bearer ${sleutel()}` },
  });
  if (!res.ok) throw new Error(`Resend receiving ${res.status}: ${await res.text()}`);
  return (await res.json()) as OntvangenEmail;
}

/** Haalt de bijlagen (met tijdelijke download-URL) van een ontvangen e-mail op. */
export async function haalBijlagen(id: string): Promise<OntvangenBijlage[]> {
  const res = await fetch(`${API}/emails/receiving/${id}/attachments`, {
    headers: { Authorization: `Bearer ${sleutel()}` },
  });
  if (!res.ok) return [];
  const j = (await res.json()) as { data?: OntvangenBijlage[]; attachments?: OntvangenBijlage[] };
  return j.data ?? j.attachments ?? [];
}

/** Leest een header case-insensitive uit beide mogelijke vormen (object of lijst). */
export function leesHeader(headers: OntvangenEmail["headers"], naam: string): string | null {
  if (!headers) return null;
  const doel = naam.toLowerCase();
  if (Array.isArray(headers)) {
    return headers.find((h) => h.name?.toLowerCase() === doel)?.value ?? null;
  }
  const sleutelNaam = Object.keys(headers).find((k) => k.toLowerCase() === doel);
  return sleutelNaam ? headers[sleutelNaam] : null;
}

/** Maakt van een adres of adressenlijst één komma-gescheiden tekst. */
export function adressenTekst(v: string[] | string | null | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v.join(", ") : v;
  return s.trim() || null;
}

/** Splitst "Naam <mail@x.nl>" in weergavenaam + e-mailadres. */
export function ontleedAfzender(from: string | null): { naam: string | null; email: string | null } {
  if (!from) return { naam: null, email: null };
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { naam: m[1].trim() || null, email: m[2].trim().toLowerCase() };
  return { naam: null, email: from.trim().toLowerCase() };
}

/**
 * Verifieert een Svix-ondertekende webhook (zoals Resend die stuurt). Vergelijkt
 * de HMAC-SHA256 over `id.timestamp.body` met de meegestuurde handtekening en
 * controleert de tijdstempel tegen replay (5 min tolerantie).
 */
export function verifieerSvix(opts: {
  payload: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  secret: string;
}): boolean {
  const { payload, svixId, svixTimestamp, svixSignature, secret } = opts;
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const nu = Math.floor(Date.now() / 1000);
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(nu - ts) > 300) return false;

  const geheimBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const teTekenen = `${svixId}.${svixTimestamp}.${payload}`;
  const verwacht = Buffer.from(
    crypto.createHmac("sha256", geheimBytes).update(teTekenen).digest("base64"),
  );

  // De header bevat één of meer spatie-gescheiden "v1,<sig>"-waarden.
  return svixSignature.split(" ").some((deel) => {
    const sig = Buffer.from(deel.split(",")[1] ?? "");
    return sig.length === verwacht.length && crypto.timingSafeEqual(sig, verwacht);
  });
}
