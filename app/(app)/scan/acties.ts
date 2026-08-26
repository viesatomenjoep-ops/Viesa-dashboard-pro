"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ScanRapport } from "@/lib/scan";

/**
 * Laadt een eerder voltooide, bewaarde scan terug (website_scans) — zodat de
 * gebruiker 'm opnieuw kan bekijken of als PDF kan downloaden zonder de scan
 * (en de vier modellen) opnieuw te draaien.
 */
export async function laadOpgeslagenScan(
  id: string,
): Promise<{ ok: boolean; rapport?: ScanRapport; fout?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("website_scans")
    .select("rapport")
    .eq("id", id)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Scan niet gevonden." };
  return { ok: true, rapport: data.rapport as ScanRapport };
}

/**
 * Maakt een deelbaar adres voor een bewaarde scan, of geeft het bestaande terug.
 *
 * De sleutel wordt hier gemaakt en niet in de database, omdat hij daarmee ook
 * ingetrokken kan worden zonder de scan te raken (zie migratie 0048). Twee keer
 * delen levert dezelfde link op — anders zou een eerder verstuurde mail
 * stilletjes doodlopen.
 */
export type RapportVariant = "volledig" | "kort" | "voorstel";

/** Het pad achter de deelsleutel, per document. */
const VARIANT_PAD: Record<RapportVariant, string> = {
  volledig: "",
  kort: "/kort",
  voorstel: "/voorstel",
};

export async function deelScan(
  id: string,
  /**
   * Welk van de drie documenten geopend moet worden. De deelsleutel is voor
   * alle drie dezelfde — ze staan op hetzelfde adres met een achtervoegsel —
   * dus delen hoeft maar één keer, welke je ook als eerste opent.
   */
  variant: RapportVariant = "volledig",
): Promise<{ ok: boolean; url?: string; fout?: string }> {
  const supabase = createClient();

  const { data: bestaand, error: leesFout } = await supabase
    .from("website_scans")
    .select("deelsleutel")
    .eq("id", id)
    .maybeSingle();
  if (leesFout) return { ok: false, fout: leesFout.message };
  if (!bestaand) return { ok: false, fout: "Scan niet gevonden." };

  let sleutel = bestaand.deelsleutel as string | null;
  if (!sleutel) {
    sleutel = randomUUID().replace(/-/g, "");
    const { error } = await supabase
      .from("website_scans")
      .update({ deelsleutel: sleutel, gedeeld_op: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, fout: error.message };
  }

  revalidatePath("/scan");
  return { ok: true, url: `/rapport/${sleutel}${VARIANT_PAD[variant]}` };
}

/** Verwijdert een bewaarde scan uit de geschiedenis. */
export async function verwijderScan(id: string): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("website_scans").delete().eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/scan");
  return { ok: true };
}
