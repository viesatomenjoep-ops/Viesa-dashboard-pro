"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vulTemplate, type OfferteStatus } from "@/lib/offertes";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Genereert een offertenummer als JAAR-0001, oplopend per jaar. */
async function volgendNummer(
  supabase: SupabaseClient,
  tabel: "offertes" | "facturen",
): Promise<string> {
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from(tabel)
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `${jaar}-%`);
  const volgnummer = String((count ?? 0) + 1).padStart(4, "0");
  return `${jaar}-${volgnummer}`;
}

export async function maakOfferte(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) {
    redirect("/offertes?fout=" + encodeURIComponent("Titel is verplicht."));
  }
  const supabase = createClient();

  const klantId = leegAlsLeeg(formData.get("klant_id"));
  const templateId = leegAlsLeeg(formData.get("template_id"));

  // Template ophalen en placeholders invullen.
  let inhoud = "";
  if (templateId) {
    const { data: tmpl } = await supabase
      .from("offerte_templates")
      .select("inhoud_markdown")
      .eq("id", templateId)
      .single();
    let klantNaam = "";
    if (klantId) {
      const { data: klant } = await supabase
        .from("klanten")
        .select("bedrijfsnaam")
        .eq("id", klantId)
        .single();
      klantNaam = klant?.bedrijfsnaam ?? "";
    }
    inhoud = vulTemplate(tmpl?.inhoud_markdown ?? "", {
      bedrijfsnaam: klantNaam,
      titel,
      datum: new Date().toLocaleDateString("nl-NL"),
    });
  }

  const nummer = await volgendNummer(supabase, "offertes");
  const { data, error } = await supabase
    .from("offertes")
    .insert({
      nummer,
      titel,
      klant_id: klantId,
      template_id: templateId,
      inhoud_markdown: inhoud,
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      notities: leegAlsLeeg(formData.get("notities")),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/offertes?fout=" +
        encodeURIComponent(error?.message ?? "Aanmaken mislukt."),
    );
  }
  revalidatePath("/offertes");
  redirect(`/offertes/${data.id}`);
}

export async function werkOfferteBij(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("offertes")
    .update({
      titel: String(formData.get("titel") ?? "").trim(),
      bedrag: Number(formData.get("bedrag") ?? 0) || 0,
      inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
      notities: leegAlsLeeg(formData.get("notities")),
      drive_pdf_url: leegAlsLeeg(formData.get("drive_pdf_url")),
    })
    .eq("id", id);
  if (error) {
    redirect(`/offertes/${id}?fout=` + encodeURIComponent(error.message));
  }
  revalidatePath(`/offertes/${id}`);
  revalidatePath("/offertes");
  redirect(`/offertes/${id}?opgeslagen=1`);
}

export async function wijzigOfferteStatus(id: string, status: OfferteStatus) {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "verzonden") {
    patch.verzonden_op = new Date().toISOString().slice(0, 10);
  }
  await supabase.from("offertes").update(patch).eq("id", id);
  revalidatePath(`/offertes/${id}`);
  revalidatePath("/offertes");
}

export async function verwijderOfferte(id: string) {
  const supabase = createClient();
  await supabase.from("offertes").delete().eq("id", id);
  revalidatePath("/offertes");
  redirect("/offertes");
}

export async function maakTemplate(formData: FormData) {
  const naam = String(formData.get("naam") ?? "").trim();
  if (!naam) redirect("/offertes/templates?fout=" + encodeURIComponent("Naam is verplicht."));
  const supabase = createClient();
  await supabase.from("offerte_templates").insert({
    naam,
    inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
  });
  revalidatePath("/offertes/templates");
  redirect("/offertes/templates");
}

export async function verwijderTemplate(id: string) {
  const supabase = createClient();
  await supabase.from("offerte_templates").delete().eq("id", id);
  revalidatePath("/offertes/templates");
}

function leegAlsLeeg(waarde: FormDataEntryValue | null): string | null {
  const s = String(waarde ?? "").trim();
  return s.length ? s : null;
}
