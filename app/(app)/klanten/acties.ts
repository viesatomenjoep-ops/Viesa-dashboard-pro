"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { KlantType } from "@/lib/klanten";
import type { SupabaseClient } from "@supabase/supabase-js";

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function klantVelden(formData: FormData) {
  return {
    bedrijf: String(formData.get("bedrijf") ?? "").trim(),
    contact_naam: leeg(formData.get("contact_naam")),
    email: leeg(formData.get("email")),
    telefoon: leeg(formData.get("telefoon")),
    website: leeg(formData.get("website")),
    straat: leeg(formData.get("straat")),
    postcode: leeg(formData.get("postcode")),
    stad: leeg(formData.get("stad")),
    regio: leeg(formData.get("regio")),
    land: leeg(formData.get("land")) ?? "Nederland",
    branche: leeg(formData.get("branche")),
    type: (String(formData.get("type") ?? "prospect") || "prospect") as KlantType,
    notities: leeg(formData.get("notities")),
  };
}

export async function maakKlant(formData: FormData) {
  const velden = klantVelden(formData);
  if (!velden.bedrijf) {
    redirect("/klanten?fout=" + encodeURIComponent("Bedrijf is verplicht."));
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("klanten").insert(velden).select("id").single();
  if (error || !data) {
    redirect("/klanten?fout=" + encodeURIComponent(error?.message ?? "Mislukt."));
  }
  revalidatePath("/klanten");
  redirect(`/klanten/${data.id}`);
}

export async function werkKlantBij(id: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("klanten").update(klantVelden(formData)).eq("id", id);
  revalidatePath(`/klanten/${id}`);
  revalidatePath("/klanten");
  redirect(`/klanten/${id}?opgeslagen=1`);
}

export async function verwijderKlant(id: string) {
  const supabase = createClient();
  await supabase.from("klanten").delete().eq("id", id);
  revalidatePath("/klanten");
  redirect("/klanten");
}

/** Bulk-import van klanten (rijen uit Excel/CSV). Alleen rijen met een bedrijf. */
export async function importeerKlanten(
  rijen: Record<string, string>[],
): Promise<{ aantal: number; fout?: string }> {
  const schoon = rijen
    .map((r) => ({
      bedrijf: (r.bedrijf ?? "").trim(),
      contact_naam: r.contact_naam || null,
      email: r.email || null,
      telefoon: r.telefoon || null,
      website: r.website || null,
      stad: r.stad || null,
      regio: r.regio || null,
      land: r.land || "Nederland",
      branche: r.branche || null,
      type: (["prospect", "klant", "partner"].includes(r.type) ? r.type : "prospect") as KlantType,
    }))
    .filter((r) => r.bedrijf.length > 0);

  if (schoon.length === 0) return { aantal: 0, fout: "Geen geldige rijen (bedrijf ontbreekt)." };

  const supabase = createClient();
  const { error } = await supabase.from("klanten").insert(schoon);
  if (error) return { aantal: 0, fout: error.message };
  revalidatePath("/klanten");
  return { aantal: schoon.length };
}

async function volgend(
  supabase: SupabaseClient,
  tabel: "offertes" | "facturen",
  prefix: string,
): Promise<string> {
  const jaar = new Date().getFullYear();
  const patroon = `${prefix}${jaar}-%`;
  const { count } = await supabase
    .from(tabel)
    .select("*", { count: "exact", head: true })
    .ilike("nummer", patroon);
  return `${prefix}${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function maakOfferteVoorKlant(klantId: string) {
  const supabase = createClient();
  const { data: klant } = await supabase.from("klanten").select("bedrijf").eq("id", klantId).single();
  const nummer = await volgend(supabase, "offertes", "VA-");
  const { data } = await supabase
    .from("offertes")
    .insert({ nummer, titel: "Nieuwe offerte", klant: klant?.bedrijf ?? null, klant_id: klantId })
    .select("id")
    .single();
  revalidatePath("/offertes");
  redirect(data ? `/offertes/${data.id}` : "/offertes");
}

export async function maakFactuurVoorKlant(klantId: string) {
  const supabase = createClient();
  const { data: klant } = await supabase.from("klanten").select("bedrijf").eq("id", klantId).single();
  const nummer = await volgend(supabase, "facturen", "VF-");
  const { data } = await supabase
    .from("facturen")
    .insert({ nummer, klant: klant?.bedrijf ?? null, klant_id: klantId, status: "concept" })
    .select("id")
    .single();
  revalidatePath("/facturen");
  redirect(data ? `/facturen/${data.id}` : "/facturen");
}

export async function maakAuditVoorKlant(klantId: string) {
  const supabase = createClient();
  const { data: klant } = await supabase.from("klanten").select("bedrijf").eq("id", klantId).single();
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("audits")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `AUD-${jaar}-%`);
  const nummer = `AUD-${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const { data } = await supabase
    .from("audits")
    .insert({
      nummer,
      titel: `Auditverslag ${klant?.bedrijf ?? ""}`.trim(),
      klant_id: klantId,
      inhoud_markdown:
        "## Samenvatting\n\n- ...\n\n## Bevindingen\n\n- ...\n\n## Aanbevelingen\n\n1. ...",
    })
    .select("id")
    .single();
  revalidatePath("/audits");
  redirect(data ? `/audits/${data.id}` : "/audits");
}

export async function maakLeadVoorKlant(klantId: string) {
  const supabase = createClient();
  const { data: klant } = await supabase
    .from("klanten")
    .select("bedrijf, stad, website")
    .eq("id", klantId)
    .single();
  const { data } = await supabase
    .from("leads")
    .insert({
      bedrijf: klant?.bedrijf ?? "Nieuwe lead",
      plaats: klant?.stad ?? null,
      website: klant?.website ?? null,
      klant_id: klantId,
      status: "nieuw",
    })
    .select("id")
    .single();
  revalidatePath("/leads");
  redirect(data ? `/leads/${data.id}` : "/leads");
}
