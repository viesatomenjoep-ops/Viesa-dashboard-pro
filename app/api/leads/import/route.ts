import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Ingest-endpoint voor de webshop-prospector.
 *
 * Beveiliging: header `x-viesa-ingest-secret` moet gelijk zijn aan
 * `LEADS_INGEST_SECRET`. Draait met de service-role sleutel (omzeilt RLS) en
 * zet `owner_id` expliciet op `OWNER_USER_ID` (jouw auth-uuid).
 *
 * Contract (JSON):
 * {
 *   "leads": [
 *     {
 *       "bedrijfsnaam": "Acme BV",          // verplicht
 *       "website": "https://acme.nl",
 *       "contact_naam": "Jan Jansen",
 *       "email": "jan@acme.nl",
 *       "telefoon": "+31 6 12345678",
 *       "score": 82,                          // 0-100
 *       "signalen": [{ "type": "Shopify", "waarde": "actief", "bron": "tech" }],
 *       "openingszin": "Ik zag dat jullie ...",
 *       "geschatte_waarde": 2500
 *     }
 *   ]
 * }
 * Eén los lead-object (zonder "leads"-wrapper) mag ook.
 */
export async function POST(request: Request) {
  const secret = process.env.LEADS_INGEST_SECRET;
  const ownerId = process.env.OWNER_USER_ID;

  if (!secret || !ownerId) {
    return NextResponse.json(
      { fout: "Server niet geconfigureerd (LEADS_INGEST_SECRET / OWNER_USER_ID)." },
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

  const binnen = Array.isArray((body as { leads?: unknown[] })?.leads)
    ? (body as { leads: unknown[] }).leads
    : [body];

  const rijen = [];
  for (const item of binnen) {
    const l = item as Record<string, unknown>;
    const bedrijfsnaam = String(l.bedrijfsnaam ?? "").trim();
    if (!bedrijfsnaam) continue; // sla incomplete records over
    rijen.push({
      owner_id: ownerId,
      bedrijfsnaam,
      website: str(l.website),
      contact_naam: str(l.contact_naam),
      email: str(l.email),
      telefoon: str(l.telefoon),
      bron: "prospector" as const,
      score: clamp(Number(l.score ?? 0), 0, 100),
      signalen: Array.isArray(l.signalen) ? l.signalen : [],
      openingszin: str(l.openingszin),
      geschatte_waarde: Number(l.geschatte_waarde ?? 0) || 0,
      stage: "nieuw" as const,
    });
  }

  if (rijen.length === 0) {
    return NextResponse.json(
      { fout: "Geen geldige leads (bedrijfsnaam ontbreekt)." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("leads").insert(rijen);
  if (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

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
