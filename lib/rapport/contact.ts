/**
 * De contactgegevens die in klantdocumenten terechtkomen.
 *
 * Op één plek, omdat ze in meerdere documenten staan (het volledige rapport,
 * de samenvatting, straks de begeleidende mail) en het adres dan niet op drie
 * plekken uit elkaar kan lopen.
 */

export const CONTACT_MAIL = "contact@viesa-automations.nl";
export const CONTACT_SITE = "viesa-automations.nl";

/**
 * Het WhatsApp-nummer, in internationale vorm zonder plus of spaties
 * (`31612345678`). Staat in de omgeving en niet hier hard in de code, zodat het
 * te wijzigen is zonder te deployen — en zodat een leeg nummer betekent: laat
 * de knop weg. Een WhatsApp-knop die naar niets leidt is erger dan geen knop.
 *
 * `NEXT_PUBLIC_`, want het rapport is een leesdocument dat ook in de browser
 * staat; er valt hier niets te verbergen.
 */
export const WHATSAPP_NUMMER = (process.env.NEXT_PUBLIC_WHATSAPP ?? "")
  .replace(/[^0-9]/g, "");

/**
 * De volledige wa.me-link, met een bericht dat de klant alleen nog hoeft te
 * versturen. De hostnaam staat erin zodat wij meteen weten over welke scan het
 * gaat — anders begint elk gesprek met "welke site was het ook alweer".
 */
export function whatsappLink(host: string): string | null {
  if (!WHATSAPP_NUMMER) return null;
  const bericht = `Hallo Viesa, ik heb de Deep Scan van ${host} bekeken en heb daar een vraag over.`;
  return `https://wa.me/${WHATSAPP_NUMMER}?text=${encodeURIComponent(bericht)}`;
}

/**
 * De agenda waarin de klant zelf een gesprek inplant (Calendly, Cal.com,
 * Google Afspraakschema's — wat dan ook, het is één link).
 *
 * Staat in de omgeving en niet in de code, om dezelfde reden als het
 * WhatsApp-nummer: de keuze van dienst mag geen deploy kosten. Is hij leeg, dan
 * valt de knop terug op een mailtje — dat werkt altijd, en is beter dan een
 * knop die naar een lege agenda wijst.
 */
export const AFSPRAAK_URL = (process.env.NEXT_PUBLIC_AFSPRAAK_URL ?? "").trim();

/** Waar "Plan een gesprek" heen gaat, en of dat een agenda of een mailtje is. */
export function afspraakDoel(host: string): { href: string; agenda: boolean } {
  if (AFSPRAAK_URL) return { href: AFSPRAAK_URL, agenda: true };
  const onderwerp = `Deep Scan ${host} — graag een gesprek`;
  return { href: `mailto:${CONTACT_MAIL}?subject=${encodeURIComponent(onderwerp)}`, agenda: false };
}
