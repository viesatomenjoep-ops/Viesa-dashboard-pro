/**
 * Variabelen (plaatshouders) voor sjablonen. Syntaxis: {{sleutel}}. Bij het
 * gebruiken van een sjabloon worden ze ingevuld vanuit de gekozen klant/lead.
 */

export type VariabeleContext = {
  bedrijf?: string | null;
  contactpersoon?: string | null;
  voornaam?: string | null;
  website?: string | null;
  stad?: string | null;
  email?: string | null;
  telefoon?: string | null;
};

export const VARIABELEN: { sleutel: keyof VariabeleContext; label: string }[] = [
  { sleutel: "bedrijf", label: "Bedrijf" },
  { sleutel: "contactpersoon", label: "Contactpersoon" },
  { sleutel: "voornaam", label: "Voornaam" },
  { sleutel: "website", label: "Website" },
  { sleutel: "stad", label: "Stad" },
  { sleutel: "email", label: "E-mail" },
  { sleutel: "telefoon", label: "Telefoon" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Vervangt {{sleutel}} door de waarde uit de context. Onbekende of lege waarden
 * worden verwijderd (leeg gelaten), zodat er geen ruwe {{...}} in de output blijft.
 *
 * `alsHtml` (standaard true): de ingevulde waarden worden HTML-ge-escaped, zodat
 * klantdata (bv. uit een import) geen HTML/scripts kan injecteren in de opmaak.
 * Zet op false bij platte tekst (bv. een e-mailonderwerp).
 */
export function vulVariabelen(
  tekst: string,
  ctx: VariabeleContext,
  alsHtml = true,
): string {
  if (!tekst) return tekst;
  return tekst.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_m, sleutel) => {
    const key = String(sleutel).toLowerCase() as keyof VariabeleContext;
    const waarde = ctx[key];
    if (!waarde) return "";
    return alsHtml ? escapeHtml(String(waarde)) : String(waarde);
  });
}

/** Bouwt een variabele-context uit een klant- of lead-achtig object. */
export function contextVanKlant(k: {
  bedrijf?: string | null;
  contact_naam?: string | null;
  voornaam?: string | null;
  achternaam?: string | null;
  website?: string | null;
  stad?: string | null;
  plaats?: string | null;
  email?: string | null;
  telefoon?: string | null;
}): VariabeleContext {
  const contact =
    k.contact_naam ||
    [k.voornaam, k.achternaam].filter(Boolean).join(" ") ||
    null;
  return {
    bedrijf: k.bedrijf ?? null,
    contactpersoon: contact,
    voornaam: k.voornaam ?? (contact ? contact.split(" ")[0] : null),
    website: k.website ?? null,
    stad: k.stad ?? k.plaats ?? null,
    email: k.email ?? null,
    telefoon: k.telefoon ?? null,
  };
}
