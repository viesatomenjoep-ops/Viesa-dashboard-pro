"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verstuurMail, mailHtml, mailHtmlRijk, saniteerHtml } from "@/lib/resend";
import { BEDRIJF } from "@/lib/bedrijf";
import { triageMail } from "@/lib/ai/mailtriage";
import { voorstelOpzet } from "@/lib/mail/voorstel-opzet";
import { tegelOpzet } from "@/lib/mail/tegel-opzet";
import type { PromoVelden } from "@/lib/mail/promo-tegels";

type MailMap = "inbox" | "verzonden" | "concepten" | "prullenbak" | "archief";

/** Mail-triage-agent (#4): classificeert + vat samen + schrijft concept-antwoord. */
export async function triageMailAgent(emailId: string) {
  const supabase = createClient();
  return triageMail(supabase, emailId);
}

/** Maakt een taak (to-do) op basis van een mail — vervolgactie vastleggen. */
export async function maakTaakVanMail(
  titel: string,
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("taken").insert({
    titel: (titel || "Mail opvolgen").slice(0, 200),
    wie: "algemeen",
    status: "todo",
    periode: "week",
    prioriteit: "normaal",
  });
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/taken");
  return { ok: true };
}

/** Verstuurt een e-mail via Resend (met optionele CC/BCC) en logt 'm. */
export async function verstuurBericht(formData: FormData) {
  const naar = String(formData.get("naar") ?? "").trim();
  const cc = String(formData.get("cc") ?? "").trim() || null;
  const bcc = String(formData.get("bcc") ?? "").trim() || null;
  const onderwerp = String(formData.get("onderwerp") ?? "").trim();
  const tekst = String(formData.get("tekst") ?? "").trim();
  const rijkeHtml = String(formData.get("html") ?? "").trim();
  const antwoordNaar = String(formData.get("antwoord_naar") ?? "").trim() || undefined;
  const klantId = String(formData.get("klant_id") ?? "").trim() || null;
  const lettertype = String(formData.get("lettertype") ?? "").trim() || null;

  if (!naar || !onderwerp || (!tekst && !rijkeHtml)) {
    redirect("/mail?fout=" + encodeURIComponent("Vul ontvanger, onderwerp en bericht in."));
  }

  // Bijlagen: door de client als JSON meegegeven (bv. een gegenereerd PDF-
  // rapport, base64). Ongeldige JSON is geen reden om het versturen te
  // blokkeren — dan gaat de mail gewoon zonder bijlage.
  let bijlagen: { filename: string; content: string }[] = [];
  const bijlagenRaw = String(formData.get("bijlagen") ?? "").trim();
  if (bijlagenRaw) {
    try {
      const parsed = JSON.parse(bijlagenRaw);
      if (Array.isArray(parsed)) {
        bijlagen = parsed.filter(
          (b): b is { filename: string; content: string } =>
            b && typeof b.filename === "string" && typeof b.content === "string",
        );
      }
    } catch {
      /* negeren — mail gaat zonder bijlage */
    }
  }

  // Opgemaakte HTML uit de rich-editor gebruiken indien aanwezig (gesaniteerd);
  // anders de platte tekst in de huisstijl-wikkel. Het in de editor gekozen
  // lettertype gaat mee, zodat de ontvanger ziet wat jij zag.
  const html = rijkeHtml
    ? mailHtmlRijk(onderwerp, saniteerHtml(rijkeHtml), lettertype)
    : mailHtml(onderwerp, tekst, lettertype);
  const supabase = createClient();

  try {
    const { id } = await verstuurMail({
      naar,
      cc: cc ?? undefined,
      bcc: bcc ?? undefined,
      onderwerp,
      html,
      tekst,
      antwoordNaar,
      bijlagen,
    });
    await supabase.from("emails").insert({
      richting: "uitgaand",
      map: "verzonden",
      van: BEDRIJF.email,
      van_naam: BEDRIJF.naam,
      naar,
      cc,
      bcc,
      onderwerp,
      html,
      tekst,
      snippet: tekst.replace(/\s+/g, " ").slice(0, 140),
      gelezen: true,
      status: "verzonden",
      provider_id: id,
      klant_id: klantId,
      heeft_bijlagen: bijlagen.length > 0,
    });
  } catch (e) {
    redirect(
      "/mail?fout=" +
        encodeURIComponent(e instanceof Error ? e.message : "Versturen mislukt."),
    );
  }

  revalidatePath("/mail");
  redirect("/mail?verzonden=1");
}

/**
 * Markeert een bericht als gelezen of ongelezen. Bij 'ongelezen' gaan we terug
 * naar de inbox — anders zou het heropenen van het bericht het meteen weer op
 * 'gelezen' zetten (de detailpagina markeert bij openen automatisch gelezen).
 */
export async function markeerGelezen(id: string, gelezen: boolean) {
  const supabase = createClient();
  await supabase.from("emails").update({ gelezen }).eq("id", id);
  revalidatePath("/mail");
  revalidatePath(`/mail/${id}`);
  if (!gelezen) redirect("/mail");
}

/** Zet/haalt een ster (markering) op een bericht. */
export async function wisselSter(id: string, ster: boolean) {
  const supabase = createClient();
  await supabase.from("emails").update({ ster }).eq("id", id);
  revalidatePath("/mail");
  revalidatePath(`/mail/${id}`);
}

/** Verplaatst een bericht naar een andere map (inbox/archief/prullenbak/…). */
export async function verplaatsMail(id: string, map: MailMap) {
  const supabase = createClient();
  await supabase.from("emails").update({ map }).eq("id", id);
  revalidatePath("/mail");
  redirect(map === "inbox" ? "/mail" : `/mail?box=${map}`);
}

/**
 * Verwijderen = soft-delete: naar de prullenbak. Zit het al in de prullenbak,
 * dan wordt het definitief verwijderd.
 */
export async function verwijderMail(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from("emails").select("map").eq("id", id).single();
  if (data?.map === "prullenbak") {
    await supabase.from("emails").delete().eq("id", id);
    revalidatePath("/mail");
    redirect("/mail?box=prullenbak");
  }
  await supabase.from("emails").update({ map: "prullenbak" }).eq("id", id);
  revalidatePath("/mail");
  redirect("/mail");
}

/**
 * Verstuurt de voorstelmail: het volledige Viesa-aanbod in de huisstijl, met
 * één knop om een gratis audit in te plannen.
 *
 * Aparte actie en niet de gewone `verstuurBericht`, om één reden: die wikkelt
 * de inhoud in `mailHtmlRijk()` — briefhoofd, titel, voettekst. Dat is precies
 * goed voor een geschreven bericht en precies verkeerd voor een mail die zelf
 * al een compleet ontwerp is. Dubbel briefhoofd, dubbele voettekst, en de
 * opmaak die eromheen valt.
 *
 * De HTML wordt hier gebouwd en niet in de browser, zodat de mail die de
 * ontvanger krijgt letterlijk uit `promotieMail()` komt en niet uit een editor
 * die er onderweg nog iets aan verandert.
 */
export async function verstuurVoorstel(formData: FormData): Promise<void> {
  const naar = String(formData.get("naar") ?? "").trim();
  const bedrijf = String(formData.get("bedrijf") ?? "").trim() || null;
  const scanId = String(formData.get("scan_id") ?? "").trim() || null;
  const klantId = String(formData.get("klant_id") ?? "").trim() || null;

  if (!naar) {
    redirect("/mail?fout=" + encodeURIComponent("Vul een ontvanger in."));
  }

  const supabase = createClient();
  // magDelen: bij het versturen mag een nog niet gedeelde scan zijn sleutel
  // krijgen, zodat de knoppen in de mail werken.
  const opzet = await voorstelOpzet(supabase, { bedrijf, scanId, magDelen: true });

  try {
    const { id } = await verstuurMail({
      naar,
      onderwerp: opzet.onderwerp,
      html: opzet.html,
      tekst: opzet.tekst,
    });
    await supabase.from("emails").insert({
      richting: "uitgaand",
      map: "verzonden",
      van: BEDRIJF.email,
      van_naam: BEDRIJF.naam,
      naar,
      onderwerp: opzet.onderwerp,
      html: opzet.html,
      tekst: opzet.tekst,
      snippet: opzet.tekst.replace(/\s+/g, " ").slice(0, 140),
      gelezen: true,
      status: "verzonden",
      provider_id: id,
      klant_id: klantId,
      heeft_bijlagen: false,
    });
  } catch (e) {
    redirect(
      "/mail?fout=" +
        encodeURIComponent(e instanceof Error ? e.message : "Versturen mislukt."),
    );
  }

  revalidatePath("/mail");
  // De scangeschiedenis kan een verse deelsleutel hebben gekregen.
  revalidatePath("/scan");
  redirect("/mail?verzonden=1");
}

/**
 * Bouwt de voorstelmail op — dezelfde weg als het versturen, maar dan om 'm
 * eerst te laten zien.
 *
 * Bestaat zodat het voorbeeldvenster exact toont wat er verstuurd wordt. Een
 * voorbeeld dat op een ander pad tot stand komt dan de echte mail is geen
 * voorbeeld maar een gok.
 */
/**
 * Verstuurt de promomail met de dienstentegels — de landingspagina in één
 * mail, met de tekst zoals die in het venster is bewerkt.
 *
 * Net als `verstuurVoorstel` een eigen actie en niet `verstuurBericht`: de
 * mail is zelf al een compleet ontwerp en mag niet nog eens in de
 * `mailHtmlRijk()`-wikkel. De HTML wordt hier gebouwd en niet in de browser,
 * zodat wat de ontvanger krijgt letterlijk uit `promoTegelsMail()` komt.
 */
export async function verstuurPromo(formData: FormData): Promise<void> {
  const naar = String(formData.get("naar") ?? "").trim();
  const klantId = String(formData.get("klant_id") ?? "").trim() || null;
  const velden: PromoVelden = {
    onderwerp: String(formData.get("onderwerp") ?? "").trim(),
    aanhef: String(formData.get("aanhef") ?? "").trim(),
    intro: String(formData.get("intro") ?? "").trim(),
    slot: String(formData.get("slot") ?? "").trim(),
    diensten: formData.getAll("diensten").map(String),
  };

  if (!naar || !velden.aanhef || !velden.intro) {
    redirect("/mail?fout=" + encodeURIComponent("Vul ontvanger, aanhef en intro in."));
  }

  const opzet = tegelOpzet(velden);
  const supabase = createClient();

  try {
    const { id } = await verstuurMail({
      naar,
      onderwerp: opzet.onderwerp,
      html: opzet.html,
      tekst: opzet.tekst,
    });
    await supabase.from("emails").insert({
      richting: "uitgaand",
      map: "verzonden",
      van: BEDRIJF.email,
      van_naam: BEDRIJF.naam,
      naar,
      onderwerp: opzet.onderwerp,
      html: opzet.html,
      tekst: opzet.tekst,
      snippet: opzet.tekst.replace(/\s+/g, " ").slice(0, 140),
      gelezen: true,
      status: "verzonden",
      provider_id: id,
      klant_id: klantId,
      heeft_bijlagen: false,
    });
  } catch (e) {
    redirect(
      "/mail?fout=" +
        encodeURIComponent(e instanceof Error ? e.message : "Versturen mislukt."),
    );
  }

  revalidatePath("/mail");
  redirect("/mail?verzonden=1");
}

/**
 * Bouwt de promomail op met de velden zoals ze nu in het venster staan —
 * dezelfde weg als het versturen, maar dan om 'm eerst te laten zien.
 */
export async function voorbeeldPromo(
  velden: PromoVelden,
): Promise<{ onderwerp: string; html: string }> {
  const opzet = tegelOpzet(velden);
  return { onderwerp: opzet.onderwerp, html: opzet.html };
}

export async function voorbeeldVoorstel(invoer: {
  bedrijf?: string | null;
  scanId?: string | null;
}): Promise<{ onderwerp: string; html: string }> {
  const supabase = createClient();
  const opzet = await voorstelOpzet(supabase, {
    bedrijf: invoer.bedrijf ?? null,
    scanId: invoer.scanId ?? null,
  });
  return { onderwerp: opzet.onderwerp, html: opzet.html };
}
