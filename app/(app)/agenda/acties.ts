"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Voegt een iCal-agenda toe op basis van een geheime .ics-link. */
export async function voegAgendaBronToe(formData: FormData) {
  const ical_url = String(formData.get("ical_url") ?? "").trim();
  const naam = String(formData.get("naam") ?? "").trim() || "Agenda";
  if (!ical_url) {
    redirect("/koppelingen?fout=" + encodeURIComponent("iCal-link is verplicht."));
  }
  // Google geeft soms een webcal://-link; die zetten we om naar https://.
  const url = ical_url.replace(/^webcal:\/\//i, "https://");
  if (!/^https?:\/\//i.test(url)) {
    redirect("/koppelingen?fout=" + encodeURIComponent("Ongeldige link (moet met http(s) beginnen)."));
  }

  const supabase = createClient();
  const { error } = await supabase.from("agenda_bronnen").insert({ naam, ical_url: url });
  if (error) redirect("/koppelingen?fout=" + encodeURIComponent(error.message));
  revalidatePath("/agenda");
  revalidatePath("/koppelingen");
  redirect("/koppelingen");
}

/** Verwijdert een gekoppelde agenda-bron. */
export async function verwijderAgendaBron(id: string) {
  const supabase = createClient();
  await supabase.from("agenda_bronnen").delete().eq("id", id);
  revalidatePath("/agenda");
  revalidatePath("/koppelingen");
}

/** Voegt een eigen herinnering toe (los van Google). */
export async function maakHerinnering(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  const wanneer = String(formData.get("wanneer") ?? "").trim();
  if (!titel || !wanneer) {
    redirect("/agenda?fout=" + encodeURIComponent("Titel en datum/tijd zijn verplicht."));
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("herinneringen")
    .insert({ titel, wanneer: new Date(wanneer).toISOString() });
  if (error) redirect("/agenda?fout=" + encodeURIComponent(error.message));
  revalidatePath("/agenda");
  revalidatePath("/");
  redirect("/agenda");
}

/** Verwijdert een eigen herinnering. */
export async function verwijderHerinnering(id: string) {
  const supabase = createClient();
  await supabase.from("herinneringen").delete().eq("id", id);
  revalidatePath("/agenda");
  revalidatePath("/");
}
