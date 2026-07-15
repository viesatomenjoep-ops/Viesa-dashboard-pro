"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaakPeriode, TaakWie } from "@/lib/taken";

/** Voegt een to-do toe. */
export async function maakTaak(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) return;
  const wie = (String(formData.get("wie") ?? "algemeen") || "algemeen") as TaakWie;
  const periode = (String(formData.get("periode") ?? "week") || "week") as TaakPeriode;
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  const klant_id = String(formData.get("klant_id") ?? "").trim() || null;

  const supabase = createClient();
  await supabase.from("taken").insert({ titel, wie, periode, deadline, klant_id });
  revalidatePath("/");
  revalidatePath("/taken");
}

/** Vinkt een to-do (af/aan). */
export async function wisselTaakKlaar(id: string, klaar: boolean) {
  const supabase = createClient();
  await supabase.from("taken").update({ klaar }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/taken");
}

/** Verwijdert een to-do. */
export async function verwijderTaak(id: string) {
  const supabase = createClient();
  await supabase.from("taken").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/taken");
}
