"use server";

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

/** Verwijdert een bewaarde scan uit de geschiedenis. */
export async function verwijderScan(id: string): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("website_scans").delete().eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/scan");
  return { ok: true };
}
