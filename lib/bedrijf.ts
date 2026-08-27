/** Vaste bedrijfsgegevens van Viesa Automations (voor briefpapier, PDF's, e-mail). */
export const BEDRIJF = {
  naam: "Viesa Automations",
  straat: "Waterkerslaan 5",
  postcode: "4907 HK",
  plaats: "Oosterhout",
  btw: "NL869573809B01",
  email: "contact@viesa-automations.nl",
  telefoon: "+31 83 052 875",
  telefoonRuw: "+3183052875",
  contactpersonen: ["Tom van Biene", "Joep Hellemons"],
  logo: "/viesa-logo.png",
  website: "www.viesa-automations.nl",
  websiteUrl: "https://www.viesa-automations.nl",
} as const;

function siteBasis(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://viesa-dashboard-pro.vercel.app"
  );
}

/** Absolute URL naar het logo (voor e-mail, waar relatieve paden niet werken). */
export function logoAbsoluut(): string {
  return `${siteBasis()}${BEDRIJF.logo}`;
}

/*
 * Er was hier ook een `logoAnimatieAbsoluut()` voor viesa-logo-animatie.gif.
 * Weggehaald, niet vergeten: die GIF heeft een witte doos om de zeshoek. Op
 * een witte mailachtergrond valt dat niet op, maar in een donkere weergave zit
 * er een wit blokje om het logo. Wil je hier ooit weer beweging, dan moet die
 * GIF eerst doorzichtig (of op navy) gezet worden.
 */

export function adresRegel(): string {
  return `${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.plaats}`;
}
