"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TaakPrioriteit } from "@/lib/taken";

export async function maakTaak(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) {
    redirect("/taken?fout=" + encodeURIComponent("Titel is verplicht."));
  }
  const supabase = createClient();
  const { error } = await supabase.from("taken").insert({
    titel,
    vervaldatum: leegAlsLeeg(formData.get("vervaldatum")),
    prioriteit: (String(formData.get("prioriteit") ?? "normaal") ||
      "normaal") as TaakPrioriteit,
    omschrijving: leegAlsLeeg(formData.get("omschrijving")),
  });
  if (error) redirect("/taken?fout=" + encodeURIComponent(error.message));
  revalidatePath("/taken");
  revalidatePath("/");
  redirect("/taken");
}

export async function rondAf(id: string) {
  const supabase = createClient();
  await supabase
    .from("taken")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/taken");
  revalidatePath("/");
}

export async function heropen(id: string) {
  const supabase = createClient();
  await supabase
    .from("taken")
    .update({ status: "open", afgerond_op: null })
    .eq("id", id);
  revalidatePath("/taken");
  revalidatePath("/");
}

export async function verwijderTaak(id: string) {
  const supabase = createClient();
  await supabase.from("taken").delete().eq("id", id);
  revalidatePath("/taken");
  revalidatePath("/");
}

function leegAlsLeeg(waarde: FormDataEntryValue | null): string | null {
  const s = String(waarde ?? "").trim();
  return s.length ? s : null;
}
