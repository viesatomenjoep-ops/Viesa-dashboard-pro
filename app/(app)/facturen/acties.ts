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
      klant_id: leeg(formData.get("klant_id")),
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

/** Stuurt de klant een betaalherinnering (Resend), logt 'm en dateert de factuur. */
export async function stuurFactuurHerinnering(id: string) {
  const supabase = createClient();
  const { data: f } = await supabase
    .from("facturen")
    .select("nummer, klant, klant_id, bedrag, btw_percentage, vervaldatum")
    .eq("id", id)
    .single();
  if (!f) redirect(`/facturen/${id}?fout=` + encodeURIComponent("Factuur niet gevonden."));

  let email: string | null = null;
  if (f.klant_id) {
    const { data: k } = await supabase
      .from("klanten")
      .select("email")
      .eq("id", f.klant_id)
      .single();
    email = (k?.email as string | null) ?? null;
  }
  if (!email) {
    redirect(
      `/facturen/${id}?fout=` +
        encodeURIComponent("Geen e-mailadres bij deze klant — koppel eerst een klant met e-mail."),
    );
  }

  const totaal = f.bedrag * (1 + (f.btw_percentage || 0) / 100);
  const totaalTekst = totaal.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
  const onderwerp = `Herinnering: factuur ${f.nummer} nog openstaand`;
  const tekst = `Beste ${f.klant ?? "relatie"},

Uit onze administratie blijkt dat factuur ${f.nummer} van ${totaalTekst} nog niet is voldaan${
    f.vervaldatum ? ` (vervaldatum ${new Date(f.vervaldatum).toLocaleDateString("nl-NL")})` : ""
  }.

Wellicht is het aan uw aandacht ontsnapt. Zou u de betaling op korte termijn willen voldoen? Heeft u de factuur inmiddels betaald, dan kunt u dit bericht als niet verzonden beschouwen.

Bij vragen over deze factuur horen we het graag.`;

  const { mailHtml, verstuurMail } = await import("@/lib/resend");
  const html = mailHtml(onderwerp, tekst);

  try {
    const { id: providerId } = await verstuurMail({ naar: email, onderwerp, html, tekst });
    await supabase.from("emails").insert({
      richting: "uitgaand",
      naar: email,
      onderwerp,
      html,
      tekst,
      status: "verzonden",
      provider_id: providerId,
      klant_id: f.klant_id ?? null,
    });
  } catch (e) {
    redirect(
      `/facturen/${id}?fout=` +
        encodeURIComponent(e instanceof Error ? e.message : "Versturen mislukt."),
    );
  }

  await supabase
    .from("facturen")
    .update({ herinnering_verstuurd_op: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidatePath(`/facturen/${id}`);
  redirect(`/facturen/${id}?opgeslagen=1`);
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
