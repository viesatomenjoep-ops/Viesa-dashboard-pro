"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genereerBellijst, type BelSuggestie } from "@/lib/ai/bellijst";

/**
 * Laat de bel-lijst-agent (#1) voorstellen wie we vandaag moeten bellen.
 * Schrijft niets — de gebruiker zet suggesties zelf op de lijst.
 */
export async function stelBellijstSamen(): Promise<{
  ok: boolean;
  suggesties: BelSuggestie[];
  fout?: string;
}> {
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

/** Haalt een lead van de bellijst af (form-actie, geeft niets terug). */
export async function haalVanBellijst(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("leads").update({ bellen: false }).eq("id", id);
  revalidatePath("/bellen");
  revalidatePath("/leads");
}
