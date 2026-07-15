import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verstuurMail } from "@/lib/resend";
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
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h1 style="color:#19445B; font-size:22px; font-weight:bold; margin:0 0 16px; border-bottom:2px solid #1E9E93; padding-bottom:10px;">Nieuwe contactaanvraag</h1>
      <div style="margin-bottom:16px; color:#1e293b;">
        <p style="margin:4px 0;"><strong>Naam:</strong> ${naam}</p>
        <p style="margin:4px 0;"><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
        ${projectType ? `<p style="margin:4px 0;"><strong>Project:</strong> ${projectType}</p>` : ""}
      </div>
      <p style="margin:0 0 8px; font-weight:bold; color:#475569;">Beschrijving:</p>
      <div style="background:#f8fafc; padding:16px; border-radius:8px; border-left:4px solid #1E9E93; color:#1e293b; line-height:1.6;">
        ${description.replace(/\n/g, "<br/>")}
      </div>
      <hr style="margin:24px 0; border:none; border-top:1px solid #e2e8f0;" />
      <p style="color:#64748b; font-size:12px;">Automatisch bericht vanaf de ${BEDRIJF.naam}-website.</p>
    </div>`;

  try {
    const { id } = await verstuurMail({
      naar: BEDRIJF.email,
      onderwerp,
      html,
      tekst: description,
      antwoordNaar: email,
    });

    // Log als 'inkomend' zodat de aanvraag in het dashboard (E-mail) verschijnt.
    const supabase = createServiceClient();
    await supabase.from("emails").insert({
      richting: "inkomend",
      van: `${naam} <${email}>`,
      naar: BEDRIJF.email,
      onderwerp,
      html,
      tekst: description,
      status: "ontvangen",
      provider_id: id,
    });

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json(
      { fout: e instanceof Error ? e.message : "versturen mislukt" },
      { status: 500, headers: CORS },
    );
  }
}
