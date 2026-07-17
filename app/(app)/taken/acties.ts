"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TaakPeriode, TaakPrioriteit, TaakStatus, TaakWie } from "@/lib/taken";

/** Voegt een to-do toe en keert terug met een bevestiging (of foutmelding). */
export async function maakTaak(formData: FormData) {
  const terug = String(formData.get("terug") ?? "/dashboard") || "/dashboard";
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) redirect(`${terug}?taakfout=` + encodeURIComponent("Vul een taak in."));
  const wie = (String(formData.get("wie") ?? "algemeen") || "algemeen") as TaakWie;
  const periode = (String(formData.get("periode") ?? "week") || "week") as TaakPeriode;
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  const klant_id = String(formData.get("klant_id") ?? "").trim() || null;
  const prioriteit = (String(formData.get("prioriteit") ?? "normaal") ||
    "normaal") as TaakPrioriteit;

  const supabase = createClient();
  const { error } = await supabase
    .from("taken")
    .insert({ titel, wie, periode, deadline, klant_id, prioriteit, status: "todo" });
  if (error) redirect(`${terug}?taakfout=` + encodeURIComponent(error.message));
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/taken");
  redirect(`${terug}?taak=1`);
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

/** Werkt titel, status en prioriteit van een taak bij (bewerken in het vol scherm). */
export async function bewerkTaak(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const status = (String(formData.get("status") ?? "todo") || "todo") as TaakStatus;
  const prioriteit = (String(formData.get("prioriteit") ?? "normaal") ||
    "normaal") as TaakPrioriteit;
  if (!id || !titel) return;
  const supabase = createClient();
  await supabase
    .from("taken")
    .update({ titel, status, prioriteit, klaar: status === "klaar" })
    .eq("id", id);
  revalidatePath("/");
  revalidatePath("/taken");
}
