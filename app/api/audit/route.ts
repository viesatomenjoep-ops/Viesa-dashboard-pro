import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { vraagAlleModellenMetCache } from "@/lib/audit-modellen";
import type { AuditResultaten } from "@/lib/audit";

/**
 * AI Visibility Audit — vraagt vier taalmodellen wie zij aanraden in een niche,
 * en kijkt of het bedrijf van de klant ertussen staat.
 *
 * De modelaanroepen zelf staan in lib/audit-modellen.ts, omdat de
 * websitescanner (/api/scan) dezelfde vraag stelt.
 */

export const runtime = "nodejs";
// Vier modellen parallel, elk tot ~40 seconden. Standaard kapt Vercel eerder af.
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });
  }

  let body: { target_url?: string; niche_keyword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldige JSON." }, { status: 400 });
  }

  const targetUrl = String(body.target_url ?? "").trim();
  const niche = String(body.niche_keyword ?? "").trim();
  if (!targetUrl || !niche) {
    return NextResponse.json(
      { fout: "Vul zowel target_url als niche_keyword in." },
      { status: 400 },
    );
  }

  const { resultaten, hergebruikt } = await vraagAlleModellenMetCache(niche, targetUrl);

  // Opslaan, maar de audit niet laten mislukken als dat niet lukt — de klant
  // zit op het resultaat te wachten, niet op onze administratie.
  let auditId: string | null = null;
  let opslagFout: string | undefined;
  const { data, error } = await supabase
    .from("ai_audits")
    .insert({
      user_id: user.id,
      target_url: targetUrl,
      niche_keyword: niche,
      llm_results: resultaten,
    })
    .select("id")
    .single();
  if (error) opslagFout = error.message;
  else auditId = data?.id ?? null;

  const modellen = Object.keys(resultaten) as (keyof AuditResultaten)[];
  return NextResponse.json({
    audit_id: auditId,
    target_url: targetUrl,
    niche_keyword: niche,
    ...resultaten,
    hergebruikt,
    samenvatting: {
      gelukt: modellen.filter((m) => resultaten[m].success).length,
      gevonden: modellen.filter((m) => resultaten[m].target_found).length,
      totaal: modellen.length,
    },
    ...(opslagFout ? { opslag_fout: opslagFout } : {}),
  });
}
