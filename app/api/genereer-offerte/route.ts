import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claudeBericht } from "@/lib/claude";

/**
 * Genereert offerte-inhoud met de Claude API op basis van:
 *  - de audit-notities + openingszin van de gekoppelde lead
 *  - het template design_docs 'design-systems/offerte-template.md'
 *  - de huisstijlregels 'design-systems/viesa-huisstijl.md'
 *
 * POST body: { "offerteId": "<uuid>" }
 * Vereist een ingelogde gebruiker (RLS via cookies).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });
  }

  let body: { offerteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldige JSON." }, { status: 400 });
  }
  if (!body.offerteId) {
    return NextResponse.json({ fout: "offerteId ontbreekt." }, { status: 400 });
  }

  const { data: offerte } = await supabase
    .from("offertes")
    .select("*, leads(bedrijf, plaats, notities, openingszin)")
    .eq("id", body.offerteId)
    .single();
  if (!offerte) {
    return NextResponse.json({ fout: "Offerte niet gevonden." }, { status: 404 });
  }

  const { data: docs } = await supabase
    .from("design_docs")
    .select("pad, inhoud_markdown")
    .in("pad", [
      "design-systems/offerte-template.md",
      "design-systems/viesa-huisstijl.md",
    ]);
  const template =
    docs?.find((d) => d.pad.endsWith("offerte-template.md"))?.inhoud_markdown ?? "";
  const huisstijl =
    docs?.find((d) => d.pad.endsWith("viesa-huisstijl.md"))?.inhoud_markdown ?? "";

  const lead = (offerte as { leads?: { bedrijf?: string; plaats?: string; notities?: string; openingszin?: string } }).leads;

  const system = [
    "Je bent offerte-assistent voor Viesa Automations.",
    "Schrijf alles in het Nederlands, zakelijk en helder.",
    "Volg deze huisstijlregels:",
    huisstijl || "(geen huisstijl aangeleverd)",
    "Gebruik dit offerte-template als structuur:",
    template || "(geen template aangeleverd)",
    "Lever Markdown: een korte inleiding gevolgd door concrete offerteregels",
    "(taak — prijsindicatie). Verzin geen bedragen als ze onbekend zijn; gebruik dan '—'.",
  ].join("\n\n");

  const prompt = [
    `Bedrijf: ${lead?.bedrijf ?? offerte.klant ?? "onbekend"}`,
    lead?.plaats ? `Plaats: ${lead.plaats}` : "",
    `Offertetitel: ${offerte.titel}`,
    lead?.openingszin ? `Openingszin: ${lead.openingszin}` : "",
    `Audit-notities van de lead:\n${lead?.notities ?? "(geen notities)"}`,
    "Schrijf de offerte-inhoud.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let inhoud: string;
  try {
    inhoud = await claudeBericht({ system, prompt, maxTokens: 1800 });
  } catch (e) {
    return NextResponse.json(
      { fout: e instanceof Error ? e.message : "Generatie mislukt." },
      { status: 500 },
    );
  }

  await supabase
    .from("offertes")
    .update({ inhoud_markdown: inhoud })
    .eq("id", offerte.id);

  return NextResponse.json({ inhoud });
}
