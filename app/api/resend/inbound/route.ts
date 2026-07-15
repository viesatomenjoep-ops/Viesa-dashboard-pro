import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import {
  haalOntvangenEmail,
  haalBijlagen,
  leesHeader,
  adressenTekst,
  ontleedAfzender,
  verifieerSvix,
  type OntvangenEmail,
} from "@/lib/resend-inbound";

export const runtime = "nodejs";

/**
 * Inbound-webhook voor Resend (ontvangen e-mails).
 *
 * Beveiliging (in volgorde van voorkeur):
 *  1. RESEND_INBOUND_SIGNING_SECRET (whsec_…) → Svix-handtekeningverificatie.
 *  2. RESEND_INBOUND_SECRET → gedeeld geheim via ?secret=… of header
 *     x-webhook-secret (handig om handmatig te testen vóór de Svix-koppeling).
 * Zonder één van beide: fail-closed (503).
 *
 * De webhook stuurt alleen metadata; de volledige inhoud + bijlagen worden via
 * de Resend receiving-API opgehaald (zie lib/resend-inbound.ts).
 */
export async function POST(request: Request) {
  const rauwBody = await request.text();

  // --- 1. Authenticatie ------------------------------------------------------
  const signingSecret = process.env.RESEND_INBOUND_SIGNING_SECRET;
  const gedeeldGeheim = process.env.RESEND_INBOUND_SECRET;

  if (signingSecret) {
    const ok = verifieerSvix({
      payload: rauwBody,
      svixId: request.headers.get("svix-id"),
      svixTimestamp: request.headers.get("svix-timestamp"),
      svixSignature: request.headers.get("svix-signature"),
      secret: signingSecret,
    });
    if (!ok) return NextResponse.json({ fout: "unauthorized" }, { status: 401 });
  } else if (gedeeldGeheim) {
    const url = new URL(request.url);
    const meegestuurd =
      url.searchParams.get("secret") ?? request.headers.get("x-webhook-secret");
    if (meegestuurd !== gedeeldGeheim) {
      return NextResponse.json({ fout: "unauthorized" }, { status: 401 });
    }
  } else {
    return NextResponse.json({ fout: "not_configured" }, { status: 503 });
  }

  // --- 2. Payload parsen -----------------------------------------------------
  let body: { type?: string; data?: Record<string, unknown> } = {};
  try {
    body = JSON.parse(rauwBody);
  } catch {
    return NextResponse.json({ fout: "invalid_json" }, { status: 400 });
  }

  // Alleen inkomende mail verwerken; andere events (delivered/bounced) negeren.
  if (body.type && body.type !== "email.received") {
    return NextResponse.json({ ok: true, genegeerd: body.type });
  }

  const data = body.data ?? {};
  const emailId = (data.email_id as string) ?? (data.id as string) ?? null;
  if (!emailId) {
    return NextResponse.json({ fout: "geen_email_id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // --- 3. Idempotentie: al verwerkt? ----------------------------------------
  const webhookMessageId = (data.message_id as string) ?? null;
  if (webhookMessageId) {
    const { data: bestaat } = await supabase
      .from("emails")
      .select("id")
      .eq("message_id", webhookMessageId)
      .maybeSingle();
    if (bestaat) return NextResponse.json({ ok: true, duplicaat: true });
  }

  // --- 4. Volledige inhoud ophalen (val terug op metadata bij een fout) ------
  let vol: OntvangenEmail;
  try {
    vol = await haalOntvangenEmail(emailId);
  } catch {
    vol = {
      id: emailId,
      from: (data.from as string) ?? null,
      to: (data.to as string[]) ?? null,
      cc: (data.cc as string[]) ?? null,
      subject: (data.subject as string) ?? null,
      message_id: webhookMessageId,
    };
  }

  const { naam: vanNaam, email: vanEmail } = ontleedAfzender(vol.from ?? (data.from as string) ?? null);
  const messageId = vol.message_id ?? webhookMessageId;
  const inReplyTo = leesHeader(vol.headers ?? null, "in-reply-to");
  const referenties = leesHeader(vol.headers ?? null, "references");
  const tekst = vol.text ?? null;

  // --- 5. Threading: koppel aan een bestaande conversatie of start een nieuwe -
  let threadId: string | null = null;
  if (inReplyTo) {
    const { data: ouder } = await supabase
      .from("emails")
      .select("thread_id")
      .eq("message_id", inReplyTo.trim())
      .maybeSingle();
    threadId = (ouder?.thread_id as string) ?? null;
  }
  if (!threadId) threadId = crypto.randomUUID();

  // --- 6. CRM-koppeling op afzenderadres ------------------------------------
  let klantId: string | null = null;
  let leadId: string | null = null;
  if (vanEmail) {
    const [{ data: klant }, { data: lead }] = await Promise.all([
      supabase.from("klanten").select("id").ilike("email", vanEmail).maybeSingle(),
      supabase.from("leads").select("id").ilike("email", vanEmail).maybeSingle(),
    ]);
    klantId = (klant?.id as string) ?? null;
    leadId = (lead?.id as string) ?? null;
  }

  // --- 7. Opslaan (HTML wordt in de UI in een sandbox-iframe getoond) --------
  const { data: nieuw, error } = await supabase
    .from("emails")
    .insert({
      richting: "inkomend",
      map: "inbox",
      status: "ontvangen",
      gelezen: false,
      van: vanEmail,
      van_naam: vanNaam,
      naar: adressenTekst(vol.to),
      cc: adressenTekst(vol.cc),
      onderwerp: vol.subject ?? null,
      html: vol.html ?? null,
      tekst,
      snippet: (tekst ?? "").replace(/\s+/g, " ").slice(0, 140) || null,
      message_id: messageId,
      in_reply_to: inReplyTo,
      referenties,
      thread_id: threadId,
      klant_id: klantId,
      lead_id: leadId,
    })
    .select("id")
    .single();

  if (error || !nieuw) {
    // Unieke index op message_id → race met een dubbele bezorging: geen fout.
    if (error?.code === "23505") return NextResponse.json({ ok: true, duplicaat: true });
    return NextResponse.json({ fout: error?.message ?? "opslaan_mislukt" }, { status: 500 });
  }

  // --- 8. Bijlagen (best effort — een fout blokkeert de mail niet) -----------
  try {
    const bijlagen = await haalBijlagen(emailId);
    let opgeslagen = 0;
    for (const b of bijlagen) {
      if (!b.download_url) continue;
      const naam = b.filename ?? `bijlage-${b.id}`;
      const pad = `${nieuw.id}/${naam}`;
      const bin = await fetch(b.download_url);
      if (!bin.ok) continue;
      const buffer = Buffer.from(await bin.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from("email-bijlagen")
        .upload(pad, buffer, { contentType: b.content_type ?? undefined, upsert: true });
      if (upErr) continue;
      await supabase.from("email_bijlagen").insert({
        email_id: nieuw.id,
        bestandsnaam: naam,
        mime: b.content_type ?? null,
        grootte: b.size ?? buffer.byteLength,
        storage_pad: pad,
        content_id: b.content_id ?? null,
      });
      opgeslagen++;
    }
    if (opgeslagen > 0) {
      await supabase.from("emails").update({ heeft_bijlagen: true }).eq("id", nieuw.id);
    }
  } catch {
    /* bijlagen mislukt — de mail zelf staat al veilig in de inbox */
  }

  return NextResponse.json({ ok: true, id: nieuw.id });
}
