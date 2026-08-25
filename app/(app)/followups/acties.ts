"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Alle plekken waar een follow-up zichtbaar is, in één keer verversen. */
function verversAlles(leadId?: string | null) {
  revalidatePath("/followups");
  revalidatePath("/bellen");
  revalidatePath("/dashboard");
  revalidatePath("/");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/**
 * Verzet een follow-up naar een nieuwe datum — zónder hem af te ronden.
 *
 * Dit ontbrak: zei iemand "bel me over een maand", dan moest je de follow-up
 * afronden en een nieuwe aanmaken. Daarmee raakte je de oorspronkelijke notitie
 * kwijt en leek het alsof er contact was geweest. Nu schuift alleen de datum op
 * en blijft de geschiedenis intact.
 */
export async function verzetFollowup(
  id: string,
  nieuweDatum: string,
): Promise<{ ok: boolean; fout?: string }> {
  if (!nieuweDatum) return { ok: false, fout: "Geen datum opgegeven." };

  const supabase = createClient();
  // `updated_at` niet zelf zetten: de set_updated_at-trigger uit migratie 0004
  // doet dat al bij elke update.
  const { data, error } = await supabase
    .from("activiteiten")
    .update({ follow_up_datum: nieuweDatum })
    .eq("id", id)
    .select("lead_id")
    .single();

  if (error) return { ok: false, fout: error.message };
  verversAlles(data?.lead_id);
  return { ok: true };
}

/**
 * Rondt een follow-up af en plant er direct een nieuwe achteraan.
 *
 * Dit is het hart van een werkende opvolging. Wie alleen afrondt, laat de lead
 * uit de cyclus vallen: er staat dan niets meer gepland en niemand merkt het.
 * Door de vervolgafspraak in dezelfde handeling te zetten, blijft elke lead die
 * nog leeft ergens op de rol staan.
 *
 * `vervolgDatum` leeg laten mag — dan wordt de follow-up alleen afgerond, en dat
 * is een bewuste keuze in plaats van een vergissing.
 */
export async function rondAfEnPlanVolgende(
  id: string,
  formData: FormData,
): Promise<{ ok: boolean; fout?: string }> {
  const vervolgDatum = String(formData.get("vervolg_datum") ?? "").trim();
  const notitie = String(formData.get("notitie") ?? "").trim();

  const supabase = createClient();

  const { data: huidig, error: leesFoutje } = await supabase
    .from("activiteiten")
    .select("lead_id, titel")
    .eq("id", id)
    .single();
  if (leesFoutje) return { ok: false, fout: leesFoutje.message };

  const { error: afrondFout } = await supabase
    .from("activiteiten")
    .update({
      status: "afgerond",
      afgerond_op: new Date().toISOString(),
      ...(notitie ? { omschrijving: notitie } : {}),
    })
    .eq("id", id);
  if (afrondFout) return { ok: false, fout: afrondFout.message };

  if (vervolgDatum && huidig?.lead_id) {
    // De titel van de vorige follow-up meenemen, zodat je over drie stappen nog
    // ziet waar het ooit over ging. Alleen als die er is; anders neutraal.
    const { error: planFout } = await supabase.from("activiteiten").insert({
      lead_id: huidig.lead_id,
      type: "follow_up",
      titel: huidig.titel?.trim() || "Opvolgen",
      omschrijving: notitie || null,
      follow_up_datum: vervolgDatum,
      status: "open",
    });
    if (planFout) return { ok: false, fout: planFout.message };
  }

  verversAlles(huidig?.lead_id);
  return { ok: true };
}

/** Rondt een follow-up af zonder vervolg. */
export async function rondFollowupAf(
  id: string,
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activiteiten")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString() })
    .eq("id", id)
    .select("lead_id")
    .single();

  if (error) return { ok: false, fout: error.message };
  verversAlles(data?.lead_id);
  return { ok: true };
}

/**
 * Zet een follow-up op een lead die er geen heeft. Gebruikt vanuit het blok
 * "Zonder follow-up" — daarmee haal je een lead in één klik terug in de cyclus.
 */
export async function planFollowupVoorLead(
  leadId: string,
  datum: string,
  titel = "Opvolgen",
): Promise<{ ok: boolean; fout?: string }> {
  if (!datum) return { ok: false, fout: "Geen datum opgegeven." };

  const supabase = createClient();
  const { error } = await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: "follow_up",
    titel,
    follow_up_datum: datum,
    status: "open",
  });

  if (error) return { ok: false, fout: error.message };
  verversAlles(leadId);
  return { ok: true };
}
