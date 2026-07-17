"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Voegt een iCal-agenda toe op basis van een geheime .ics-link. Het verborgen
 * veld `terug` bepaalt waar je na afloop landt (/agenda of /koppelingen).
 */
export async function voegAgendaBronToe(formData: FormData) {
  const terug = String(formData.get("terug") ?? "") === "/agenda" ? "/agenda" : "/koppelingen";
  const ical_url = String(formData.get("ical_url") ?? "").trim();
  const naam = String(formData.get("naam") ?? "").trim() || "Agenda";
  if (!ical_url) {
    redirect(`${terug}?fout=` + encodeURIComponent("iCal-link is verplicht."));
  }
  // Google geeft soms een webcal://-link; die zetten we om naar https://.
  const url = ical_url.replace(/^webcal:\/\//i, "https://");
  if (!/^https?:\/\//i.test(url)) {
    redirect(`${terug}?fout=` + encodeURIComponent("Ongeldige link (moet met http(s) beginnen)."));
  }

  const supabase = createClient();
  const { error } = await supabase.from("agenda_bronnen").insert({ naam, ical_url: url });
  if (error) redirect(`${terug}?fout=` + encodeURIComponent(error.message));
  revalidatePath("/agenda");
  revalidatePath("/koppelingen");
  redirect(terug);
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

/** Combineert een datum (YYYY-MM-DD) en tijd (HH:MM) tot een ISO-string. */
function naarIso(datum: string, tijd: string): string | null {
  if (!datum) return null;
  const d = new Date(`${datum}T${(tijd || "09:00").slice(0, 5)}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Voegt een agenda-item toe vanuit het "+"-scherm. Twee soorten:
 *  - "activiteit": eigen agenda-afspraak (begin/eind/locatie) → agenda_activiteiten
 *  - "herinnering": losse herinnering (datum + tijd) → herinneringen
 */
export async function maakAgendaItem(formData: FormData) {
  const soort = String(formData.get("soort") ?? "activiteit");
  const titel = String(formData.get("titel") ?? "").trim();
  if (!titel) {
    redirect("/agenda?fout=" + encodeURIComponent("Naam is verplicht."));
  }
  const supabase = createClient();

  if (soort === "herinnering") {
    const heeftTijd = String(formData.get("tijd_aan") ?? "") === "on";
    const wanneer = naarIso(
      String(formData.get("datum") ?? ""),
      heeftTijd ? String(formData.get("tijd") ?? "") : "09:00",
    );
    if (!wanneer) redirect("/agenda?fout=" + encodeURIComponent("Kies een datum."));
    const { error } = await supabase.from("herinneringen").insert({ titel, wanneer });
    if (error) redirect("/agenda?fout=" + encodeURIComponent(error.message));
  } else {
    const heleDag = String(formData.get("hele_dag") ?? "") === "on";
    const begin = naarIso(
      String(formData.get("begin_datum") ?? ""),
      heleDag ? "00:00" : String(formData.get("begin_tijd") ?? ""),
    );
    const eind = naarIso(
      String(formData.get("eind_datum") ?? "") || String(formData.get("begin_datum") ?? ""),
      heleDag ? "23:59" : String(formData.get("eind_tijd") ?? ""),
    );
    if (!begin) redirect("/agenda?fout=" + encodeURIComponent("Kies een begindatum."));
    const locatie = String(formData.get("locatie") ?? "").trim() || null;
    const { error } = await supabase
      .from("agenda_activiteiten")
      .insert({ titel, locatie, begin_ts: begin, eind_ts: eind, hele_dag: heleDag });
    if (error) redirect("/agenda?fout=" + encodeURIComponent(error.message));
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect("/agenda?opgeslagen=1");
}

/** Verwijdert een eigen agenda-activiteit. */
export async function verwijderActiviteit(id: string) {
  const supabase = createClient();
  await supabase.from("agenda_activiteiten").delete().eq("id", id);
  revalidatePath("/agenda");
  revalidatePath("/");
}
