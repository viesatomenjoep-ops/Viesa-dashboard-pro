import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verstuurMail, mailHtmlRijk } from "@/lib/resend";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Publiek contactformulier-endpoint (voor de Viesa-website). Ontvangt een
 * aanvraag, mailt die via Resend naar contact@viesa-automations.nl (met de
 * aanvrager als reply-to) en logt 'm als 'inkomend' in de emails-tabel zodat
 * 'ie in het dashboard verschijnt.
 *
 * Body (JSON): { firstName, lastName, email, projectType?, description }
 * CORS: sta cross-origin POSTs toe zodat de website hierheen kan posten.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ fout: "invalid_json" }, { status: 400, headers: CORS });
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const projectType = String(body.projectType ?? "").trim();
  const description = String(body.description ?? "").trim();

  if (!email || !description) {
    return NextResponse.json(
      { fout: "email en description zijn verplicht" },
      { status: 400, headers: CORS },
    );
  }

  const naam = `${firstName} ${lastName}`.trim() || email;
  const onderwerp = `Nieuwe aanvraag van ${naam}`;
  const mailBody = `
      <div style="margin-bottom:16px;">
        <p style="margin:4px 0;"><strong>Naam:</strong> ${naam}</p>
        <p style="margin:4px 0;"><strong>E-mail:</strong> <a href="mailto:${email}" style="color:#19445B;">${email}</a></p>
        ${projectType ? `<p style="margin:4px 0;"><strong>Project:</strong> ${projectType}</p>` : ""}
      </div>
      <p style="margin:0 0 8px; font-weight:bold; color:#475569;">Beschrijving:</p>
      <div style="background:#f8fafc; padding:16px; border-radius:8px; border-left:4px solid #19445B; line-height:1.6;">
        ${description.replace(/\n/g, "<br/>")}
      </div>
      <p style="color:#94a3b8; font-size:12px; margin:16px 0 0;">Automatisch bericht vanaf de ${BEDRIJF.naam}-website.</p>`;
  const html = mailHtmlRijk("Nieuwe contactaanvraag", mailBody);

  // 1) Altijd loggen zodat de aanvraag in het dashboard (E-mail → Ontvangen)
  //    verschijnt — ongeacht of de Resend-notificatie lukt.
  let providerId: string | null = null;
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("emails").insert({
      richting: "inkomend",
      van: `${naam} <${email}>`,
      naar: BEDRIJF.email,
      onderwerp,
      html,
      tekst: description,
      status: "ontvangen",
    });
    if (error) {
      return NextResponse.json({ fout: error.message }, { status: 500, headers: CORS });
    }
  } catch (e) {
    return NextResponse.json(
      { fout: e instanceof Error ? e.message : "opslaan mislukt" },
      { status: 500, headers: CORS },
    );
  }

  // 2) Notificatie-mail (best effort) — een fout hier mag de aanvraag niet blokkeren.
  try {
    const res = await verstuurMail({
      naar: BEDRIJF.email,
      onderwerp,
      html,
      tekst: description,
      antwoordNaar: email,
    });
    providerId = res.id;
  } catch {
    /* Resend nog niet (volledig) geconfigureerd — aanvraag staat al in dashboard */
  }

  return NextResponse.json({ ok: true, mailVerzonden: Boolean(providerId) }, { headers: CORS });
}
