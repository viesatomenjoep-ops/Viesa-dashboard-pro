import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { promotieMail, type PromoMail } from "@/lib/mail/promo-mail";
import { CONTACT_MAIL, AFSPRAAK_URL, whatsappLink } from "@/lib/rapport/contact";

/**
 * Zet een keuze in het dashboard om in een verzendklare voorstelmail.
 *
 * Deze laag bestaat om één reden: de mail die de ontvanger krijgt en de mail
 * die in het voorbeeldvenster staat moeten langs exact hetzelfde pad tot stand
 * komen. Zo niet, dan is het voorbeeld geen voorbeeld maar een gok — en dat
 * merk je pas als de prospect 'm al binnen heeft.
 *
 * Wat hier gebeurt is niet meer dan opzoekwerk: hoort er een scan bij, dan
 * worden de deellinks en de score erbij gezocht. De opmaak zit in
 * `promotieMail()`, en die is puur en los te testen.
 */

export type VoorstelOpzet = PromoMail & {
  /** De host uit de scan, als die erbij zit — voor de logregel. */
  host: string | null;
};

export async function voorstelOpzet(
  supabase: SupabaseClient,
  invoer: { bedrijf?: string | null; scanId?: string | null },
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

      // Zonder deelsleutel is het rapport niet openbaar te openen. Dan liever
      // geen link dan een link die op een 404 uitkomt: deel de scan eerst.
      const sleutel = data.deelsleutel as string | null;
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
    siteUrl,
  });

  return { ...mail, host };
}
