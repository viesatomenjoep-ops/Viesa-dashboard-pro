"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/leads";
import type { ActiviteitType } from "@/lib/activiteiten";

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

export async function werkLeadBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      bedrijf: String(formData.get("bedrijf") ?? "").trim(),
      plaats: leeg(formData.get("plaats")),
      website: leeg(formData.get("website")),
      contact_naam: leeg(formData.get("contact_naam")),
      email: leeg(formData.get("email")),
      telefoon: leeg(formData.get("telefoon")),
      status: (String(formData.get("status") ?? "nieuw") || "nieuw") as LeadStatus,
      score: Number(formData.get("score") ?? 0),
      verwachte_waarde: Number(formData.get("verwachte_waarde") ?? 0),
      openingszin: leeg(formData.get("openingszin")),
      notities: leeg(formData.get("notities")),
    })
    .eq("id", id);
  if (error) redirect(`/leads/${id}?fout=` + encodeURIComponent(error.message));
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

export async function rondActiviteitAf(id: string, leadId: string) {
  const supabase = createClient();
  await supabase
    .from("activiteiten")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
