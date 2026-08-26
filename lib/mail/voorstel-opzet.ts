import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { promotieMail, type PromoMail } from "@/lib/mail/promo-mail";
import { CONTACT_MAIL, AFSPRAAK_URL, whatsappLink, logoUrlVoorMail } from "@/lib/rapport/contact";

/**
 * Zet een keuze in het dashboard om in een verzendklare voorstelmail.
 *
 * Deze laag bestaat om één reden: de mail die de ontvanger krijgt en de mail
 * die in het voorbeeldvenster staat moeten langs exact hetzelfde pad tot stand
 * komen. Zo niet, dan is het voorbeeld geen voorbeeld maar een gok — en dat
 * merk je pas als de prospect 'm al binnen heeft.
 *
 * Wat hier gebeurt is opzoekwerk: hoort er een scan bij, dan worden de
 * deellinks en de score erbij gezocht. De opmaak zit in `promotieMail()`, en
 * die is puur en los te testen.
 *
 * Eén uitzondering op "alleen opzoeken": bij het versturen mag een scan die nog
 * geen deelsleutel heeft er hier één krijgen (`magDelen`). Anders zou je eerst
 * naar /scan moeten om op het deel-icoon te klikken, en dan een mail versturen
 * met een dode knop erin als je dat vergeet. Het voorbeeldvenster doet dit
 * nadrukkelijk níét: een voorbeeld hoort niets te veranderen.
 */

export type VoorstelOpzet = PromoMail & {
  /** De host uit de scan, als die erbij zit — voor de logregel. */
  host: string | null;
};

export async function voorstelOpzet(
  supabase: SupabaseClient,
  invoer: {
    bedrijf?: string | null;
    scanId?: string | null;
    /**
     * Alleen waar bij het daadwerkelijk versturen. Maakt een deelsleutel aan
     * voor een scan die er nog geen heeft, zodat de link in de mail werkt.
     */
    magDelen?: boolean;
  },
): Promise<VoorstelOpzet> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://viesa-automations.nl").replace(
    /\/$/,
    "",
  );

  let host: string | null = null;
  let rapportUrl: string | null = null;
  let korteUrl: string | null = null;
  let score: number | null = null;
  let bedrijf = invoer.bedrijf?.trim() || null;

  if (invoer.scanId) {
    const { data } = await supabase
      .from("website_scans")
      .select("host, bedrijf, totaal_score, deelsleutel")
      .eq("id", invoer.scanId)
      .maybeSingle();

    if (data) {
      host = (data.host as string | null) ?? null;
      score = (data.totaal_score as number | null) ?? null;
      // De naam uit de scan alleen gebruiken als er niets is ingevuld: wat de
      // gebruiker typt weet meer dan wat wij ooit hebben opgeslagen.
      bedrijf = bedrijf ?? ((data.bedrijf as string | null) ?? null);

      // Zonder deelsleutel is het rapport niet openbaar te openen. Bij het
      // versturen maken we er dan alsnog één aan; in het voorbeeld niet, want
      // dat hoort niets te veranderen aan de database.
      let sleutel = data.deelsleutel as string | null;
      if (!sleutel && invoer.magDelen) {
        sleutel = randomUUID().replace(/-/g, "");
        const { error } = await supabase
          .from("website_scans")
          .update({ deelsleutel: sleutel, gedeeld_op: new Date().toISOString() })
          .eq("id", invoer.scanId);
        // Lukt het delen niet, dan gaat de mail zonder scanlinks de deur uit.
        // Dat is beter dan hem tegenhouden: het aanbod klopt ook zonder scan.
        if (error) sleutel = null;
      }

      if (sleutel) {
        rapportUrl = `${siteUrl}/rapport/${sleutel}`;
        korteUrl = `${siteUrl}/rapport/${sleutel}/kort`;
      }
    }
  }

  const mail = promotieMail({
    bedrijf,
    host,
    rapportUrl,
    korteUrl,
    score,
    afspraakUrl: AFSPRAAK_URL || null,
    whatsappUrl: host ? whatsappLink(host) : whatsappLink("uw website"),
    contactMail: CONTACT_MAIL,
    logoUrl: logoUrlVoorMail(),
  });

  return { ...mail, host };
}
