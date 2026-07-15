"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { KlantStatus, KlantType } from "@/lib/klanten";
import { bewaarCategorieWaarden } from "@/lib/categorieen";
import { auditVerslagTemplate, offerteTemplate } from "@/lib/documenttemplates";
import type { SupabaseClient } from "@supabase/supabase-js";

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/** Kommagetal uit een formulierveld; null bij leeg/ongeldig. */
function getal(v: FormDataEntryValue | null): number | null {
  const t = String(v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Geheel getal uit een formulierveld; null bij leeg/ongeldig. */
function geheelGetal(v: FormDataEntryValue | null): number | null {
  const n = getal(v);
  return n === null ? null : Math.round(n);
}

function klantVelden(formData: FormData) {
  const score = getal(formData.get("score"));
  return {
    bedrijf: String(formData.get("bedrijf") ?? "").trim(),
    contact_naam: leeg(formData.get("contact_naam")),
    email: leeg(formData.get("email")),
    telefoon: leeg(formData.get("telefoon")),
    telefoon_contact: leeg(formData.get("telefoon_contact")),
    website: leeg(formData.get("website")),
    straat: leeg(formData.get("straat")),
    postcode: leeg(formData.get("postcode")),
    stad: leeg(formData.get("stad")),
    regio: leeg(formData.get("regio")),
    land: leeg(formData.get("land")) ?? "Nederland",
    branche: leeg(formData.get("branche")),
    type: (String(formData.get("type") ?? "prospect") || "prospect") as KlantType,
    logo_url: leeg(formData.get("logo_url")),
    notities: leeg(formData.get("notities")),
    // 0024: Google-Places + contactpersoon + categorie
    place_id: leeg(formData.get("place_id")),
    rating_google: getal(formData.get("rating_google")),
    aantal_reviews: geheelGetal(formData.get("aantal_reviews")),
    voornaam: leeg(formData.get("voornaam")),
    achternaam: leeg(formData.get("achternaam")),
    functie: leeg(formData.get("functie")),
    seniority: leeg(formData.get("seniority")),
    afdeling: leeg(formData.get("afdeling")),
    linkedin: leeg(formData.get("linkedin")),
    twitter: leeg(formData.get("twitter")),
    it_aanbod: leeg(formData.get("it_aanbod")),
    platform: leeg(formData.get("platform")),
    score: score === null ? 50 : Math.min(100, Math.max(0, Math.round(score))),
    status: (String(formData.get("status") ?? "actief") || "actief") as KlantStatus,
    // 0026: kwalificatie
    bedrijfsgrootte: leeg(formData.get("bedrijfsgrootte")),
    aantal_medewerkers: geheelGetal(formData.get("aantal_medewerkers")),
  };
}

/** Nieuwe/gewijzigde categoriewaarden van een klant persisteren. */
async function bewaarKlantCategorieen(
  supabase: SupabaseClient,
  v: ReturnType<typeof klantVelden>,
): Promise<void> {
  await bewaarCategorieWaarden(supabase, [
    { soort: "it_aanbod", waarde: v.it_aanbod },
    { soort: "platform", waarde: v.platform },
    { soort: "branche", waarde: v.branche },
    { soort: "bedrijfsgrootte", waarde: v.bedrijfsgrootte },
  ]);
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
  await bewaarKlantCategorieen(supabase, velden);
  revalidatePath("/klanten");
  redirect(`/klanten/${data.id}`);
}

export async function werkKlantBij(id: string, formData: FormData) {
  const supabase = createClient();
  const velden = klantVelden(formData);
  await supabase.from("klanten").update(velden).eq("id", id);
  await bewaarKlantCategorieen(supabase, velden);
  revalidatePath(`/klanten/${id}`);
  revalidatePath("/klanten");
  redirect(`/klanten/${id}?opgeslagen=1`);
}

/**
 * Registreert een benaderpoging (0025): verhoogt de teller en zet de datum op nu.
 * Wordt met één knop op de klantpagina aangeroepen.
 */
export async function registreerBenaderd(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("klanten")
    .select("benaderd_count")
    .eq("id", id)
    .single();
  const huidig = Number(data?.benaderd_count ?? 0);
  await supabase
    .from("klanten")
    .update({ benaderd_count: huidig + 1, laatst_benaderd_op: new Date().toISOString() })
    .eq("id", id);
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

/** Voegt een bestand (link) toe aan een specifieke klant, met categorie. */
export async function voegKlantBestandToe(klantId: string, formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    redirect(`/klanten/${klantId}?fout=` + encodeURIComponent("URL is verplicht."));
  }
  const categorie = String(formData.get("categorie") ?? "").trim() || null;
  const supabase = createClient();

  if (categorie) {
    await supabase
      .from("bestand_categorieen")
      .upsert({ naam: categorie }, { onConflict: "naam" });
  }

  const { error } = await supabase.from("drive_links").insert({
    titel: String(formData.get("titel") ?? "").trim() || url,
    url,
    type: String(formData.get("type") ?? "drive") || "drive",
    categorie,
    context_type: "klant",
    context_id: klantId,
  });
  if (error) {
    redirect(`/klanten/${klantId}?fout=` + encodeURIComponent(error.message));
  }
  revalidatePath(`/klanten/${klantId}`);
  redirect(`/klanten/${klantId}`);
}

/** Verwijdert een bestand (link) van een klant. */
export async function verwijderKlantBestand(klantId: string, id: string) {
  const supabase = createClient();
  await supabase.from("drive_links").delete().eq("id", id);
  revalidatePath(`/klanten/${klantId}`);
}

/** Bulk-import van klanten (rijen uit Excel/CSV). Alleen rijen met een bedrijf. */
export async function importeerKlanten(
  rijen: Record<string, string>[],
): Promise<{ aantal: number; fout?: string }> {
  const naarGetal = (s?: string): number | null => {
    const t = String(s ?? "").trim().replace(",", ".");
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  const naarGeheel = (s?: string): number | null => {
    const n = naarGetal(s);
    return n === null ? null : Math.round(n);
  };
  const schoon = rijen
    .map((r) => ({
      bedrijf: (r.bedrijf ?? "").trim(),
      contact_naam: r.contact_naam || null,
      email: r.email || null,
      telefoon: r.telefoon || null,
      telefoon_contact: r.telefoon_contact || null,
      website: r.website || null,
      stad: r.stad || r.plaats || null,
      regio: r.regio || r.provincie || null,
      land: r.land || "Nederland",
      branche: r.branche || null,
      type: (["prospect", "klant", "partner"].includes(r.type) ? r.type : "prospect") as KlantType,
      logo_url: r.logo_url || null,
      // Google-Places + contactpersoon + categorie (0024)
      place_id: r.place_id || null,
      rating_google: naarGetal(r.rating_google),
      aantal_reviews: naarGeheel(r.aantal_reviews),
      voornaam: r.voornaam || null,
      achternaam: r.achternaam || null,
      functie: r.functie || null,
      seniority: r.seniority || null,
      afdeling: r.afdeling || null,
      linkedin: r.linkedin || null,
      twitter: r.twitter || null,
      it_aanbod: r.it_aanbod || null,
      platform: r.platform || null,
      // kwalificatie (0026)
      bedrijfsgrootte: r.bedrijfsgrootte || null,
      aantal_medewerkers: naarGeheel(r.aantal_medewerkers),
    }))
    .filter((r) => r.bedrijf.length > 0);

  if (schoon.length === 0) return { aantal: 0, fout: "Geen geldige rijen (bedrijf ontbreekt)." };

  const supabase = createClient();
  const { error } = await supabase.from("klanten").insert(schoon);
  if (error) return { aantal: 0, fout: error.message };
  await bewaarCategorieWaarden(supabase, [
    ...schoon.map((r) => ({ soort: "it_aanbod" as const, waarde: r.it_aanbod })),
    ...schoon.map((r) => ({ soort: "platform" as const, waarde: r.platform })),
    ...schoon.map((r) => ({ soort: "branche" as const, waarde: r.branche })),
    ...schoon.map((r) => ({ soort: "bedrijfsgrootte" as const, waarde: r.bedrijfsgrootte })),
  ]);
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
    .insert({
      nummer,
      titel: `Offerte ${klant?.bedrijf ?? ""}`.trim(),
      klant: klant?.bedrijf ?? null,
      klant_id: klantId,
      inhoud_markdown: offerteTemplate(klant?.bedrijf ?? "[bedrijf]"),
    })
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
      inhoud_markdown: auditVerslagTemplate(klant?.bedrijf ?? "[bedrijf]"),
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
