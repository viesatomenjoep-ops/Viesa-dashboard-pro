"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaakPeriode, TaakPrioriteit, TaakStatus, TaakWie } from "@/lib/taken";

/** Voegt een to-do toe. */
export async function maakTaak(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) return;
  const wie = (String(formData.get("wie") ?? "algemeen") || "algemeen") as TaakWie;
  const periode = (String(formData.get("periode") ?? "week") || "week") as TaakPeriode;
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  const klant_id = String(formData.get("klant_id") ?? "").trim() || null;
  const prioriteit = (String(formData.get("prioriteit") ?? "normaal") ||
    "normaal") as TaakPrioriteit;

  const supabase = createClient();
  await supabase
    .from("taken")
    .insert({ titel, wie, periode, deadline, klant_id, prioriteit, status: "todo" });
  revalidatePath("/");
  revalidatePath("/taken");
}

/** Vinkt een to-do (af/aan) en houdt de kanban-status gelijk. */
export async function wisselTaakKlaar(id: string, klaar: boolean) {
  const supabase = createClient();
  await supabase
    .from("taken")
    .update({ klaar, status: klaar ? "klaar" : "todo" })
    .eq("id", id);
  revalidatePath("/");
  revalidatePath("/taken");
}

/** Verplaatst een taak naar een andere kanban-kolom/positie (drag & drop). */
export async function verplaatsTaak(id: string, status: TaakStatus, positie: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("taken")
    .update({ status, positie, klaar: status === "klaar" })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/");
  revalidatePath("/taken");
  return { ok: true };
}

/** Verwijdert een to-do. */
export async function verwijderTaak(id: string) {
  const supabase = createClient();
  await supabase.from("taken").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/taken");
}
