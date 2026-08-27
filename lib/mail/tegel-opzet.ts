import "server-only";
import {
  promoTegelsMail,
  type PromoVelden,
  type PromoTegelsMail,
} from "@/lib/mail/promo-tegels";
import {
  CONTACT_MAIL,
  AFSPRAAK_URL,
  whatsappLinkAlgemeen,
  logoUrlVoorMail,
} from "@/lib/rapport/contact";

/**
 * Zet de bewerkte velden uit het verzendvenster om in een verzendklare
 * tegelmail. Dezelfde laag als `voorstel-opzet.ts`, om dezelfde reden: het
 * voorbeeld in het venster en de mail die verstuurd wordt moeten langs exact
 * hetzelfde pad tot stand komen — anders is het voorbeeld een gok.
 *
 * Hier valt niets op te zoeken (geen scan, geen deelsleutel); wat deze laag
 * toevoegt zijn de omgevingswaarden: agenda-link, WhatsApp-nummer, logo-adres.
 * Die horen niet in de client thuis en niet in de pure opmaakfunctie.
 */
export function tegelOpzet(velden: PromoVelden): PromoTegelsMail {
  return promoTegelsMail({
    ...velden,
    afspraakUrl: AFSPRAAK_URL || null,
    whatsappUrl: whatsappLinkAlgemeen(),
    contactMail: CONTACT_MAIL,
    logoUrl: logoUrlVoorMail(),
  });
}
