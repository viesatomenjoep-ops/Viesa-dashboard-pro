"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Genereert een factuurnummer VF-JJJJ-NNN, oplopend per jaar. */
async function volgendNummer(supabase: SupabaseClient): Promise<string> {
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("facturen")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `VF-${jaar}-%`);
  return `VF-${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function maakFactuur(formData: FormData) {
  const supabase = createClient();

  const factuurdatum =
    leeg(formData.get("factuurdatum")) ?? new Date().toISOString().slice(0, 10);
  let vervaldatum = leeg(formData.get("vervaldatum"));
  if (!vervaldatum) {
    const d = new Date(factuurdatum);
    d.setDate(d.getDate() + 14);
    vervaldatum = d.toISOString().slice(0, 10);
  }

  const nummer = await volgendNummer(supabase);
  const { data, error } = await supabase
    .from("facturen")
    .insert({
      nummer,
      klant: leeg(formData.get("klant")),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      btw_percentage: Number(formData.get("btw_percentage") ?? 21),
      factuurdatum,
      vervaldatum,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/facturen?fout=" + encodeURIComponent(error?.message ?? "Mislukt."));
  }
  revalidatePath("/facturen");
  redirect(`/facturen/${data.id}`);
}

export async function werkFactuurBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("facturen")
    .update({
      klant: leeg(formData.get("klant")),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      btw_percentage: Number(formData.get("btw_percentage") ?? 21),
      factuurdatum: leeg(formData.get("factuurdatum")),
      vervaldatum: leeg(formData.get("vervaldatum")),
      drive_pdf_url: leeg(formData.get("drive_pdf_url")),
    })
    .eq("id", id);
  if (error) redirect(`/facturen/${id}?fout=` + encodeURIComponent(error.message));
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
  redirect(`/facturen/${id}?opgeslagen=1`);
}

/** Zet op betaald met een gevraagde betaaldatum (werkt de omzet-view door). */
export async function markeerBetaald(id: string, formData: FormData) {
  const betaaldOp =
    leeg(formData.get("betaald_op")) ?? new Date().toISOString().slice(0, 10);
  const supabase = createClient();
  await supabase
    .from("facturen")
    .update({ status: "betaald", betaald_op: betaaldOp })
    .eq("id", id);
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
  revalidatePath("/");
}

/** Concept-factuur versturen: status naar open. */
export async function markeerOpen(id: string) {
  const supabase = createClient();
  await supabase.from("facturen").update({ status: "open" }).eq("id", id);
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
}

export async function markeerVervallen(id: string) {
  const supabase = createClient();
  await supabase.from("facturen").update({ status: "vervallen" }).eq("id", id);
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
}

export async function heropenFactuur(id: string) {
  const supabase = createClient();
  await supabase
    .from("facturen")
    .update({ status: "open", betaald_op: null })
    .eq("id", id);
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
  revalidatePath("/");
}

export async function verwijderFactuur(id: string) {
  const supabase = createClient();
  await supabase.from("facturen").delete().eq("id", id);
  revalidatePath("/facturen");
  redirect("/facturen");
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
