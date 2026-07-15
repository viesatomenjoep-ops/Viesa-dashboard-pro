"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OfferteStatus } from "@/lib/offertes";
import type { SupabaseClient } from "@supabase/supabase-js";

async function volgendNummer(supabase: SupabaseClient): Promise<string> {
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("offertes")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `VA-${jaar}-%`);
  return `VA-${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function maakOfferte(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) {
    redirect("/offertes?fout=" + encodeURIComponent("Titel is verplicht."));
  }
  const supabase = createClient();
  const nummer = await volgendNummer(supabase);
  const { data, error } = await supabase
    .from("offertes")
    .insert({
      nummer,
      titel,
      klant: leeg(formData.get("klant")),
      klant_id: leeg(formData.get("klant_id")),
      lead_id: leeg(formData.get("lead_id")),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/offertes?fout=" + encodeURIComponent(error?.message ?? "Mislukt."));
  }
  revalidatePath("/offertes");
  redirect(`/offertes/${data.id}`);
}

/** Maakt een concept-factuur uit een geaccepteerde offerte. */
export async function maakFactuurVanOfferte(offerteId: string) {
  const supabase = createClient();
  const { data: offerte, error } = await supabase
    .from("offertes")
    .select("*")
    .eq("id", offerteId)
    .single();
  if (error || !offerte) {
    redirect(`/offertes/${offerteId}?fout=` + encodeURIComponent("Offerte niet gevonden."));
  }

  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("facturen")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `VF-${jaar}-%`);
  const nummer = `VF-${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: factuur, error: fFout } = await supabase
    .from("facturen")
    .insert({
      nummer,
      klant: offerte.klant,
      lead_id: offerte.lead_id,
      offerte_id: offerte.id,
      bedrag: offerte.bedrag,
      status: "concept",
    })
    .select("id")
    .single();
  if (fFout || !factuur) {
    redirect(`/offertes/${offerteId}?fout=` + encodeURIComponent(fFout?.message ?? "Mislukt."));
  }
  revalidatePath("/facturen");
  redirect(`/facturen/${factuur.id}`);
}

export async function werkOfferteBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("offertes")
    .update({
      titel: String(formData.get("titel") ?? "").trim(),
      klant: leeg(formData.get("klant")),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
      drive_pdf_url: leeg(formData.get("drive_pdf_url")),
    })
    .eq("id", id);
  if (error) redirect(`/offertes/${id}?fout=` + encodeURIComponent(error.message));
  revalidatePath(`/offertes/${id}`);
  revalidatePath("/offertes");
  redirect(`/offertes/${id}?opgeslagen=1`);
}

export async function wijzigOfferteStatus(id: string, status: OfferteStatus) {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "verzonden") patch.verzonden_op = new Date().toISOString().slice(0, 10);
  await supabase.from("offertes").update(patch).eq("id", id);
  revalidatePath(`/offertes/${id}`);
  revalidatePath("/offertes");
  revalidatePath("/");
}

export async function verwijderOfferte(id: string) {
  const supabase = createClient();
  await supabase.from("offertes").delete().eq("id", id);
  revalidatePath("/offertes");
  redirect("/offertes");
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
