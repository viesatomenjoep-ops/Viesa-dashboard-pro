import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Import-endpoint voor de webshop-prospector.
 *
 * Beveiliging: header `x-viesa-ingest-secret` moet gelijk zijn aan
 * `LEADS_INGEST_SECRET`. Draait met de service-role sleutel (omzeilt RLS).
 *
 * Contract (JSON) — één object of { "leads": [ ... ] }:
 * {
 *   "bron": "webshop-prospector",
 *   "leads": [
 *     {
 *       "bedrijf": "De Koffiebranderij",   // verplicht
 *       "plaats": "Utrecht",
 *       "website": "https://...",
 *       "score": 82,                         // 0-100
 *       "signalen": [{ "type": "Platform", "waarde": "WooCommerce" }],
 *       "openingszin": "Ik zag dat ...",
 *       "verwachte_waarde": 4500
 *     }
 *   ]
 * }
 *
 * Slaat leads op met bron 'prospector' en legt een prospector_runs-regel vast.
 */
export async function POST(request: Request) {
  const secret = process.env.LEADS_INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { fout: "Server niet geconfigureerd (LEADS_INGEST_SECRET)." },
      { status: 500 },
    );
  }
  if (request.headers.get("x-viesa-ingest-secret") !== secret) {
    return NextResponse.json({ fout: "Niet geautoriseerd." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldige JSON." }, { status: 400 });
  }

  const wrapper = body as { leads?: unknown[]; bron?: string };
  const binnen = Array.isArray(wrapper?.leads) ? wrapper.leads : [body];
  const bron = typeof wrapper?.bron === "string" ? wrapper.bron : "webshop-prospector";
  const ownerId = process.env.OWNER_USER_ID || null;

  const rijen = [];
  for (const item of binnen) {
    const l = item as Record<string, unknown>;
    const bedrijf = String(l.bedrijf ?? l.bedrijfsnaam ?? "").trim();
    if (!bedrijf) continue;
    rijen.push({
      owner_id: ownerId,
      bedrijf,
      plaats: str(l.plaats),
      website: str(l.website),
      bron: "prospector" as const,
      score: clamp(Number(l.score ?? 0), 0, 100),
      signalen: Array.isArray(l.signalen) ? l.signalen : [],
      openingszin: str(l.openingszin),
      verwachte_waarde: Number(l.verwachte_waarde ?? 0) || 0,
      status: "nieuw" as const,
    });
  }

  const supabase = createServiceClient();

  if (rijen.length === 0) {
    await supabase.from("prospector_runs").insert({
      owner_id: ownerId,
      bron,
      status: "mislukt",
      aantal_leads: 0,
      voltooid_op: new Date().toISOString(),
      details: { reden: "geen geldige leads" },
    });
    return NextResponse.json(
      { fout: "Geen geldige leads (bedrijf ontbreekt)." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("leads").insert(rijen);
  if (error) {
    await supabase.from("prospector_runs").insert({
      owner_id: ownerId,
      bron,
      status: "mislukt",
      aantal_leads: 0,
      voltooid_op: new Date().toISOString(),
      details: { fout: error.message },
    });
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

  await supabase.from("prospector_runs").insert({
    owner_id: ownerId,
    bron,
    status: "klaar",
    aantal_leads: rijen.length,
    voltooid_op: new Date().toISOString(),
  });

  return NextResponse.json({ toegevoegd: rijen.length });
}

function str(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
