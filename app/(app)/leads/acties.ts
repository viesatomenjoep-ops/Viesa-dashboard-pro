"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeadBron, LeadStatus } from "@/lib/leads";
import type { ActiviteitType } from "@/lib/activiteiten";
import { bewaarCategorieWaarden } from "@/lib/categorieen";

/** Snel een lead toevoegen — alleen bedrijf is verplicht. */
export async function maakLead(formData: FormData) {
  const bedrijf = String(formData.get("bedrijf") ?? "").trim();
  if (!bedrijf) {
    redirect("/leads?fout=" + encodeURIComponent("Bedrijf is verplicht."));
  }
  const supabase = createClient();
  const { error } = await supabase.from("leads").insert({
    bedrijf,
    plaats: leeg(formData.get("plaats")),
    website: leeg(formData.get("website")),
    status: "nieuw",
    bron: "handmatig",
  });
  if (error) redirect("/leads?fout=" + encodeURIComponent(error.message));
  revalidatePath("/leads");
  redirect("/leads");
}

/**
 * Maakt van een lead een klant (type prospect) met de leadgegevens en koppelt
 * de lead aan die klant (klant_id). Bestond er al een koppeling, dan gaan we
 * naar die klant.
 */
export async function maakKlantVanLead(leadId: string) {
  const supabase = createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (!lead) redirect("/leads");

  if (lead.klant_id) redirect(`/klanten/${lead.klant_id}`);

  const { data: klant, error } = await supabase
    .from("klanten")
    .insert({
      bedrijf: lead.bedrijf,
      contact_naam: lead.contact_naam ?? null,
      email: lead.email ?? null,
      telefoon: lead.telefoon ?? null,
      website: lead.website ?? null,
      stad: lead.plaats ?? null,
      type: "prospect",
    })
    .select("id")
    .single();
  if (error || !klant) {
    redirect(`/leads/${leadId}?fout=` + encodeURIComponent(error?.message ?? "Mislukt."));
  }

  await supabase.from("leads").update({ klant_id: klant.id }).eq("id", leadId);
  revalidatePath("/klanten");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/klanten/${klant.id}`);
}

export async function werkLeadBij(id: string, formData: FormData) {
  const supabase = createClient();
  const it_aanbod = leeg(formData.get("it_aanbod"));
  const platform = leeg(formData.get("platform"));
  const branche = leeg(formData.get("branche"));
  const bedrijfsgrootte = leeg(formData.get("bedrijfsgrootte"));
  const { error } = await supabase
    .from("leads")
    .update({
      bedrijf: String(formData.get("bedrijf") ?? "").trim(),
      plaats: leeg(formData.get("plaats")),
      website: leeg(formData.get("website")),
      contact_naam: leeg(formData.get("contact_naam")),
      email: leeg(formData.get("email")),
      telefoon: leeg(formData.get("telefoon")),
      bron: (String(formData.get("bron") ?? "handmatig") || "handmatig") as LeadBron,
      status: (String(formData.get("status") ?? "nieuw") || "nieuw") as LeadStatus,
      score: Number(formData.get("score") ?? 0),
      verwachte_waarde: Number(formData.get("verwachte_waarde") ?? 0),
      openingszin: leeg(formData.get("openingszin")),
      notities: leeg(formData.get("notities")),
      // geo
      land: leeg(formData.get("land")) ?? "Nederland",
      provincie: leeg(formData.get("provincie")),
      // categorie
      it_aanbod,
      platform,
      // Google-Places
      adres: leeg(formData.get("adres")),
      place_id: leeg(formData.get("place_id")),
      rating_google: getal(formData.get("rating_google")),
      aantal_reviews: geheelGetal(formData.get("aantal_reviews")),
      // contactpersoon
      voornaam: leeg(formData.get("voornaam")),
      achternaam: leeg(formData.get("achternaam")),
      functie: leeg(formData.get("functie")),
      seniority: leeg(formData.get("seniority")),
      afdeling: leeg(formData.get("afdeling")),
      linkedin: leeg(formData.get("linkedin")),
      twitter: leeg(formData.get("twitter")),
      telefoon_contact: leeg(formData.get("telefoon_contact")),
      // kwalificatie
      branche,
      bedrijfsgrootte,
      aantal_medewerkers: geheelGetal(formData.get("aantal_medewerkers")),
    })
    .eq("id", id);
  if (error) redirect(`/leads/${id}?fout=` + encodeURIComponent(error.message));
  await bewaarCategorieWaarden(supabase, [
    { soort: "it_aanbod", waarde: it_aanbod },
    { soort: "platform", waarde: platform },
    { soort: "branche", waarde: branche },
    { soort: "bedrijfsgrootte", waarde: bedrijfsgrootte },
  ]);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?opgeslagen=1`);
}

/** Verplaatst een lead naar een andere kolom/positie (drag & drop). */
export async function verplaatsLead(
  id: string,
  status: LeadStatus,
  positie: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, positie })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function verwijderLead(id: string) {
  const supabase = createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  redirect("/leads");
}

/** Werkt alleen de score van een lead bij (inline autosave). */
export async function werkLeadScore(id: string, score: number) {
  const veilig = Math.max(0, Math.min(100, Math.round(score)));
  const supabase = createClient();
  const { error } = await supabase.from("leads").update({ score: veilig }).eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

/** Maakt een activiteit bij een lead. */
export async function maakActiviteit(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: (String(formData.get("type") ?? "notitie") || "notitie") as ActiviteitType,
    titel: leeg(formData.get("titel")),
    omschrijving: leeg(formData.get("omschrijving")),
  });
  revalidatePath(`/leads/${leadId}`);
}

/** Plant een follow-up (activiteit type follow_up met datum). */
export async function planFollowup(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: "follow_up",
    titel: leeg(formData.get("titel")) ?? "Follow-up",
    follow_up_datum: leeg(formData.get("follow_up_datum")),
    status: "open",
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/** Belnotitie: een notitie (notities-tabel) gekoppeld aan een lead. */
export async function maakLeadNotitie(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("notities").insert({
    lead_id: leadId,
    titel: String(formData.get("titel") ?? "Belnotitie").trim() || "Belnotitie",
    inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function verwijderLeadNotitie(id: string, leadId: string) {
  const supabase = createClient();
  await supabase.from("notities").delete().eq("id", id);
  revalidatePath(`/leads/${leadId}`);
}

export async function rondActiviteitAf(id: string, leadId: string) {
  const supabase = createClient();
  await supabase
    .from("activiteiten")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/** Bulk-import van leads (rijen uit Excel/CSV). Alleen rijen met een bedrijf. */
export async function importeerLeads(
  rijen: Record<string, string>[],
): Promise<{ aantal: number; fout?: string }> {
  const schoon = rijen
    .map((r) => {
      const score = Number(r.score ?? 0);
      const waarde = Number((r.verwachte_waarde ?? "").replace(",", "."));
      return {
        bedrijf: (r.bedrijf ?? "").trim(),
        plaats: r.plaats || r.stad || null,
        website: r.website || null,
        contact_naam: r.contact_naam || null,
        email: r.email || null,
        telefoon: r.telefoon || null,
        score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0,
        verwachte_waarde: Number.isFinite(waarde) ? waarde : 0,
        status: "nieuw" as const,
        // Geïmporteerde leads herkenbaar maken (0023: bron-check kent 'import').
        bron: "import" as const,
        // geo + categorie (0024)
        land: r.land || "Nederland",
        provincie: r.provincie || null,
        it_aanbod: r.it_aanbod || null,
        platform: r.platform || null,
        // Google-Places (0023)
        adres: r.adres || null,
        place_id: r.place_id || null,
        rating_google: teksNaarGetal(r.rating_google),
        aantal_reviews: teksNaarGeheel(r.aantal_reviews),
        // contactpersoon (0023)
        voornaam: r.voornaam || null,
        achternaam: r.achternaam || null,
        functie: r.functie || null,
        seniority: r.seniority || null,
        afdeling: r.afdeling || null,
        linkedin: r.linkedin || null,
        twitter: r.twitter || null,
        telefoon_contact: r.telefoon_contact || null,
        // kwalificatie (0026)
        branche: r.branche || null,
        bedrijfsgrootte: r.bedrijfsgrootte || null,
        aantal_medewerkers: teksNaarGeheel(r.aantal_medewerkers),
      };
    })
    .filter((r) => r.bedrijf.length > 0);

  if (schoon.length === 0) return { aantal: 0, fout: "Geen geldige rijen (bedrijf ontbreekt)." };
  const supabase = createClient();
  const { error } = await supabase.from("leads").insert(schoon);
  if (error) return { aantal: 0, fout: error.message };
  await bewaarCategorieWaarden(supabase, [
    ...schoon.map((r) => ({ soort: "it_aanbod" as const, waarde: r.it_aanbod })),
    ...schoon.map((r) => ({ soort: "platform" as const, waarde: r.platform })),
    ...schoon.map((r) => ({ soort: "branche" as const, waarde: r.branche })),
    ...schoon.map((r) => ({ soort: "bedrijfsgrootte" as const, waarde: r.bedrijfsgrootte })),
  ]);
  revalidatePath("/leads");
  return { aantal: schoon.length };
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/** Kommagetal (bv. Google-rating) uit een formulierveld; null bij leeg/ongeldig. */
function getal(v: FormDataEntryValue | null): number | null {
  return teksNaarGetal(String(v ?? ""));
}

/** Geheel getal uit een formulierveld; null bij leeg/ongeldig. */
function geheelGetal(v: FormDataEntryValue | null): number | null {
  return teksNaarGeheel(String(v ?? ""));
}

function teksNaarGetal(s: string | undefined | null): number | null {
  const t = String(s ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function teksNaarGeheel(s: string | undefined | null): number | null {
  const n = teksNaarGetal(s);
  return n === null ? null : Math.round(n);
}
