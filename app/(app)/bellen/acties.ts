"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  genereerBellijst,
  type BellijstUitkomst,
} from "@/lib/ai/bellijst";
import { BEL_UITKOMSTEN, type BelUitkomst } from "@/lib/activiteiten";

/**
 * Laat de bel-lijst-agent (#1) voorstellen wie we vandaag moeten bellen.
 * Schrijft niets — de gebruiker zet suggesties zelf op de lijst.
 */
export async function stelBellijstSamen(): Promise<BellijstUitkomst> {
  const supabase = createClient();
  return genereerBellijst(supabase, 8);
}

/**
 * Zet één AI-suggestie op de bellijst, met de gesprekspunten als bel-notitie.
 * Dit is de bevestigingsstap: de mens bepaalt, niet de agent.
 */
export async function zetSuggestieOpLijst(
  leadId: string,
  gesprekspunten: string[],
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const notitie = (gesprekspunten ?? [])
    .filter(Boolean)
    .map((p) => `• ${p}`)
    .join("\n");
  const { error } = await supabase
    .from("leads")
    .update({ bellen: true, bel_notitie: notitie || null })
    .eq("id", leadId);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/bellen");
  revalidatePath("/leads");
  return { ok: true };
}

/**
 * Zet een zelf gekozen lead handmatig op de bellijst — geen AI, geen
 * gesprekspunten die worden overschreven. Voor als je zelf al weet wie je
 * wilt bellen, los van de suggesties hierboven.
 */
export async function voegLeadToeAanBellijst(
  leadId: string,
): Promise<{ ok: boolean; fout?: string }> {
  if (!leadId) return { ok: false, fout: "Geen lead gekozen." };
  const supabase = createClient();
  const { error } = await supabase.from("leads").update({ bellen: true }).eq("id", leadId);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/bellen");
  revalidatePath("/leads");
  return { ok: true };
}

/** Haalt een lead van de bellijst af (form-actie, geeft niets terug). */
export async function haalVanBellijst(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("leads").update({ bellen: false }).eq("id", id);
  revalidatePath("/bellen");
  revalidatePath("/leads");
}

/**
 * Legt een gevoerd belgesprek vast — het hart van de belmodule.
 *
 * In één handeling:
 *   1. een activiteit van type 'call' met de uitkomst en je notitie, zodat het
 *      gesprek in het activiteitenlog van de lead blijft staan;
 *   2. eventueel een follow-up (activiteit type 'follow_up' met datum) — die
 *      verschijnt daarmee vanzelf op het dashboard en in de dagbriefing;
 *   3. de lead bijwerken: laatst_gebeld, belpogingen +1, en wel/niet van de
 *      bellijst af, afhankelijk van de uitkomst.
 *
 * Migratie 0040 hoeft nog niet gedraaid te zijn: de kolommen `uitkomst` en
 * `belpogingen` worden dan overgeslagen in plaats van dat het opslaan faalt.
 */
export async function legGesprekVast(leadId: string, formData: FormData) {
  const supabase = createClient();

  const uitkomst = String(formData.get("uitkomst") ?? "").trim() as BelUitkomst;
  const notitie = String(formData.get("notitie") ?? "").trim();
  const followupDatum = String(formData.get("follow_up_datum") ?? "").trim();
  const meta = BEL_UITKOMSTEN.find((u) => u.key === uitkomst);
  if (!meta) return;

  // 1) Het gesprek zelf als activiteit.
  const gesprek = {
    lead_id: leadId,
    type: "call" as const,
    titel: `Gebeld — ${meta.label}`,
    omschrijving: notitie || null,
    status: "afgerond" as const,
    afgerond_op: new Date().toISOString(),
  };
  const { error: gesprekFout } = await supabase
    .from("activiteiten")
    .insert({ ...gesprek, uitkomst });
  if (gesprekFout) {
    // Kolom `uitkomst` bestaat nog niet (migratie 0040) — dan zonder.
    await supabase.from("activiteiten").insert(gesprek);
  }

  // 2) De follow-up, als er een datum is opgegeven.
  if (followupDatum) {
    await supabase.from("activiteiten").insert({
      lead_id: leadId,
      type: "follow_up",
      titel: `Terugbellen — ${meta.label.toLowerCase()}`,
      omschrijving: notitie || null,
      follow_up_datum: followupDatum,
      status: "open",
    });
  }

  // 3) De lead bijwerken.
  const { data: huidig } = await supabase
    .from("leads")
    .select("belpogingen")
    .eq("id", leadId)
    .single();

  const leadUpdate = {
    bellen: meta.blijftOpLijst,
    laatst_gebeld: new Date().toISOString(),
  };
  const { error: leadFout } = await supabase
    .from("leads")
    .update({
      ...leadUpdate,
      belpogingen: Number(huidig?.belpogingen ?? 0) + 1,
    })
    .eq("id", leadId);
  if (leadFout) {
    await supabase.from("leads").update(leadUpdate).eq("id", leadId);
  }

  revalidatePath("/bellen");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
}
