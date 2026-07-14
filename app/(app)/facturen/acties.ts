"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FactuurStatus } from "@/lib/facturen";
import type { SupabaseClient } from "@supabase/supabase-js";

async function volgendNummer(supabase: SupabaseClient): Promise<string> {
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("facturen")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `${jaar}-%`);
  return `${jaar}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function maakFactuur(formData: FormData) {
  const supabase = createClient();

  const factuurdatum =
    leegAlsLeeg(formData.get("factuurdatum")) ??
    new Date().toISOString().slice(0, 10);

  // Standaard vervaldatum = factuurdatum + 14 dagen.
  let vervaldatum = leegAlsLeeg(formData.get("vervaldatum"));
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
      klant_id: leegAlsLeeg(formData.get("klant_id")),
      offerte_id: leegAlsLeeg(formData.get("offerte_id")),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      btw_percentage: Number(formData.get("btw_percentage") ?? 21),
      factuurdatum,
      vervaldatum,
      status: "concept",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/facturen?fout=" +
        encodeURIComponent(error?.message ?? "Aanmaken mislukt."),
    );
  }
  revalidatePath("/facturen");
  redirect(`/facturen/${data.id}`);
}

export async function werkFactuurBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("facturen")
    .update({
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      btw_percentage: Number(formData.get("btw_percentage") ?? 21),
      factuurdatum: leegAlsLeeg(formData.get("factuurdatum")),
      vervaldatum: leegAlsLeeg(formData.get("vervaldatum")),
      drive_pdf_url: leegAlsLeeg(formData.get("drive_pdf_url")),
    })
    .eq("id", id);
  if (error) redirect(`/facturen/${id}?fout=` + encodeURIComponent(error.message));
  revalidatePath(`/facturen/${id}`);
  revalidatePath("/facturen");
  redirect(`/facturen/${id}?opgeslagen=1`);
}

export async function wijzigFactuurStatus(id: string, status: FactuurStatus) {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  patch.betaald_op =
    status === "betaald" ? new Date().toISOString().slice(0, 10) : null;
  await supabase.from("facturen").update(patch).eq("id", id);
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

/**
 * Plant een betaalherinnering in. De daadwerkelijke verzending gebeurt via de
 * Gmail/Outlook-koppeling (Fase 10) of de dagelijkse cron.
 */
export async function planHerinnering(id: string) {
  const supabase = createClient();
  await supabase.from("factuur_herinneringen").insert({
    factuur_id: id,
    kanaal: "gmail",
    status: "gepland",
    bericht: "Vriendelijke herinnering: deze factuur staat nog open.",
  });
  revalidatePath(`/facturen/${id}`);
}

function leegAlsLeeg(waarde: FormDataEntryValue | null): string | null {
  const s = String(waarde ?? "").trim();
  return s.length ? s : null;
}
