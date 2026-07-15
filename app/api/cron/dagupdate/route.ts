import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verstuurMail, mailHtmlRijk } from "@/lib/resend";
import { BEDRIJF } from "@/lib/bedrijf";
import {
  verzamelDagUpdate,
  dagUpdateBody,
  dagUpdateTekst,
  dagTotaal,
} from "@/lib/dagupdate";

export const runtime = "nodejs";

/**
 * Dagelijkse cron (Vercel): stuurt een samenvatting van alle wijzigingen van de
 * afgelopen 24 uur (nieuwe leads, klanten, offertes, facturen, projecten) naar de
 * vaste ontvangers, en logt 'm als verzonden bericht in het postvak.
 * Beveiligd met CRON_SECRET (Authorization: Bearer … of ?secret=…).
 *
 * Ontvangers instelbaar via env DAGUPDATE_ONTVANGERS (komma-gescheiden).
 */
const STANDAARD_ONTVANGERS = ["tomvanbien@gmail.com", "contact@viesa-automations.nl"];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ fout: "CRON_SECRET ontbreekt." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  const viaQuery = new URL(request.url).searchParams.get("secret");
  if (auth !== `Bearer ${secret}` && viaQuery !== secret) {
    return NextResponse.json({ fout: "Niet geautoriseerd." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const sinds = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const periode = `afgelopen 24 uur — ${new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })}`;

  const data = await verzamelDagUpdate(supabase, sinds);
  const totaal = dagTotaal(data);

  const ontvangers = (process.env.DAGUPDATE_ONTVANGERS ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const naar = ontvangers.length ? ontvangers : STANDAARD_ONTVANGERS;

  const titel = `Viesa dagupdate — ${totaal} wijziging${totaal === 1 ? "" : "en"}`;
  const html = mailHtmlRijk(titel, dagUpdateBody(data, periode));
  const tekst = dagUpdateTekst(data, periode);

  let providerId: string | null = null;
  try {
    const res = await verstuurMail({ naar, onderwerp: titel, html, tekst });
    providerId = res.id;
  } catch (e) {
    return NextResponse.json(
      { fout: e instanceof Error ? e.message : "verzenden mislukt", totaal },
      { status: 500 },
    );
  }

  // Loggen als verzonden bericht zodat het ook in het postvak (Verzonden) staat.
  await supabase.from("emails").insert({
    richting: "uitgaand",
    map: "verzonden",
    van: BEDRIJF.email,
    van_naam: BEDRIJF.naam,
    naar: naar.join(", "),
    onderwerp: titel,
    html,
    tekst,
    snippet: tekst.replace(/\s+/g, " ").slice(0, 140),
    gelezen: true,
    status: "verzonden",
    provider_id: providerId,
  });

  return NextResponse.json({ ok: true, verstuurd_naar: naar, totaal });
}
