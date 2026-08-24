import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/brand-factory/sync
 *
 * Ontvangt een manifest.json van een lokale batch-run en synchroniseert:
 * - merk (upsert op slug)
 * - producten (upsert op merk_id + handle)
 * - concepten (upsert op merk_id + key)
 * - renders (insert per variant)
 *
 * Auth: via BRAND_FACTORY_SECRET in de header (server-to-server; service-role
 * client omdat er geen ingelogde gebruiker is). Draai dit vanuit n8n of een
 * post-render hook op je Mac:
 *   curl -X POST https://dashboard.viesa.nl/api/brand-factory/sync \
 *     -H "Authorization: Bearer $BRAND_FACTORY_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d @manifest.json
 */
export async function POST(req: NextRequest) {
  const secret = process.env.BRAND_FACTORY_SECRET;
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || auth !== secret) {
    return NextResponse.json({ fout: "Niet geautoriseerd" }, { status: 401 });
  }

  const body = await req.json();
  const { brand, batch, rendered_at, ads, brand_json, products } = body as {
    brand: string;
    batch: string;
    rendered_at: string;
    ads: any[];
    brand_json?: any;
    products?: any[];
  };

  if (!brand || !batch || !ads?.length) {
    return NextResponse.json({ fout: "brand, batch en ads zijn verplicht" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1. Merk upserten
  const { data: merk } = await supabase
    .from("merken")
    .upsert(
      {
        slug: brand,
        naam: brand_json?.name || brand,
        shop_url: brand_json?.shop_url || null,
        tokens: brand_json?.tokens || {},
        surfaces: brand_json?.surfaces || {},
        usps: brand_json?.usps || [],
        copy_regels: brand_json?.copy || {},
        bijgewerkt_op: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (!merk) return NextResponse.json({ fout: "Merk upsert mislukt" }, { status: 500 });

  // 2. Producten syncen (als meegestuurd)
  if (products?.length) {
    const rijen = products.map((p: any) => ({
      merk_id: merk.id,
      handle: p.handle,
      titel: p.title,
      product_type: p.product_type || null,
      beschikbaar: p.available ?? true,
      prijs: p.price,
      adviesprijs: p.compare_at_price || null,
      afbeelding: p.image || null,
      model: p.model || null,
      energielabel: p.energy_label || null,
      varianten: p.variants || [],
      gescraped_op: new Date().toISOString(),
    }));
    await supabase.from("merk_producten").upsert(rijen, { onConflict: "merk_id,handle" });
  }

  // 3. Concepten + renders
  let rendersIngevoegd = 0;
  for (const ad of ads) {
    const { data: concept } = await supabase
      .from("ad_concepten")
      .upsert(
        {
          merk_id: merk.id,
          key: ad.key,
          batch,
          mechaniek: ad.mechanic || "product",
          template: ad.template || "feed-1080",
          product_handle: ad.product_handle || null,
          headline: ad.headline ? (typeof ad.headline === "string" ? { nl: ad.headline } : ad.headline) : null,
          status: "gerenderd",
        },
        { onConflict: "merk_id,key" }
      )
      .select("id")
      .single();

    if (concept) {
      await supabase.from("ad_renders").insert({
        concept_id: concept.id,
        variant: ad.variant || `${ad.key}_default`,
        bestand_url: ad.bestand_url || null,
        formaat: ad.file?.match(/\d+x\d+/)?.[0] || null,
        breedte: ad.w || 1080,
        hoogte: ad.h || 1080,
        type: ad.file?.endsWith(".mp4") ? "video" : "still",
        gerenderd_op: rendered_at,
      });
      rendersIngevoegd++;
    }
  }

  return NextResponse.json({
    ok: true,
    merk_id: merk.id,
    concepten: ads.length,
    renders: rendersIngevoegd,
  });
}
