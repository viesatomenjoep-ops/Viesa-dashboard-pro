"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeadStage } from "@/lib/leads";

/** Snel een lead toevoegen — alleen bedrijfsnaam is verplicht (<30 sec). */
export async function maakLead(formData: FormData) {
  const bedrijfsnaam = String(formData.get("bedrijfsnaam") ?? "").trim();
  if (!bedrijfsnaam) {
    redirect("/leads?fout=" + encodeURIComponent("Bedrijfsnaam is verplicht."));
  }

  const supabase = createClient();
  const { error } = await supabase.from("leads").insert({
    bedrijfsnaam,
    website: leegAlsLeeg(formData.get("website")),
    contact_naam: leegAlsLeeg(formData.get("contact_naam")),
    email: leegAlsLeeg(formData.get("email")),
    stage: "nieuw",
    bron: "handmatig",
  });

  if (error) {
    redirect("/leads?fout=" + encodeURIComponent(error.message));
  }
  revalidatePath("/leads");
  redirect("/leads");
}

/** Volledige lead bijwerken vanuit de detailpagina. */
export async function werkLeadBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      bedrijfsnaam: String(formData.get("bedrijfsnaam") ?? "").trim(),
      website: leegAlsLeeg(formData.get("website")),
      contact_naam: leegAlsLeeg(formData.get("contact_naam")),
      email: leegAlsLeeg(formData.get("email")),
      telefoon: leegAlsLeeg(formData.get("telefoon")),
      stage: String(formData.get("stage") ?? "nieuw") as LeadStage,
      score: Number(formData.get("score") ?? 0),
      geschatte_waarde: Number(formData.get("geschatte_waarde") ?? 0),
      openingszin: leegAlsLeeg(formData.get("openingszin")),
      notities: leegAlsLeeg(formData.get("notities")),
    })
    .eq("id", id);

  if (error) {
    redirect(`/leads/${id}?fout=` + encodeURIComponent(error.message));
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?opgeslagen=1`);
}

/** Verplaatst een lead naar een andere kolom/positie (drag & drop). */
export async function verplaatsLead(
  id: string,
  stage: LeadStage,
  positie: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ stage, positie })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

/** Verwijdert een lead. */
export async function verwijderLead(id: string) {
  const supabase = createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  redirect("/leads");
}

/** Maakt een klant van een lead en markeert de lead als gewonnen. */
export async function maakKlantVanLead(id: string) {
  const supabase = createClient();

  const { data: lead, error: leesFout } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (leesFout || !lead) {
    redirect(`/leads/${id}?fout=` + encodeURIComponent("Lead niet gevonden."));
  }

  const { data: klant, error: klantFout } = await supabase
    .from("klanten")
    .insert({
      bedrijfsnaam: lead.bedrijfsnaam,
      contact_naam: lead.contact_naam,
      email: lead.email,
      telefoon: lead.telefoon,
      website: lead.website,
    })
    .select("id")
    .single();
  if (klantFout || !klant) {
    redirect(
      `/leads/${id}?fout=` +
        encodeURIComponent(klantFout?.message ?? "Klant aanmaken mislukt."),
    );
  }

  await supabase
    .from("leads")
    .update({ klant_id: klant.id, stage: "gewonnen" })
    .eq("id", id);

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?klant=1`);
}

function leegAlsLeeg(waarde: FormDataEntryValue | null): string | null {
  const s = String(waarde ?? "").trim();
  return s.length ? s : null;
}
