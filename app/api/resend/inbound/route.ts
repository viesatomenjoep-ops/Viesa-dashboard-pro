import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Inbound-webhook voor Resend (ontvangen e-mails). Configureer in Resend een
 * inbound-route naar deze URL. Beveiligd met een gedeeld geheim: stuur
 * ?secret=<RESEND_INBOUND_SECRET> mee (of header 'x-webhook-secret').
 *
 * Let op: 'ontvangen' vereist een geverifieerd domein + inbound-configuratie
 * in Resend. Zonder dat blijft dit endpoint ongebruikt.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const geheim = process.env.RESEND_INBOUND_SECRET;
  const meegestuurd =
    url.searchParams.get("secret") ?? request.headers.get("x-webhook-secret");
  if (geheim && meegestuurd !== geheim) {
    return NextResponse.json({ fout: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ fout: "invalid_json" }, { status: 400 });
  }

  // Resend levert de gegevens onder 'data' (of platgeslagen). Beide afvangen.
  const data = (body.data as Record<string, unknown>) ?? body;
  const van = (data.from as string) ?? null;
  const naar = Array.isArray(data.to) ? (data.to as string[]).join(", ") : (data.to as string) ?? null;
  const onderwerp = (data.subject as string) ?? null;
  const html = (data.html as string) ?? null;
  const tekst = (data.text as string) ?? null;

  const supabase = createServiceClient();
  const { error } = await supabase.from("emails").insert({
    richting: "inkomend",
    van,
    naar,
    onderwerp,
    html,
    tekst,
    status: "ontvangen",
  });
  if (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
