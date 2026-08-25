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
  /** Geanimeerde variant: schuift bij het openen van de mail open. */
  logoAnimatie: "/viesa-logo-animatie.gif",
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

/**
 * Absolute URL naar het geanimeerde logo. Gebruik dit alléén bovenaan de mail:
 * een GIF is de enige animatie die Gmail toont, en één bewegend element in een
 * zakelijke mail is genoeg.
 */
export function logoAnimatieAbsoluut(): string {
  return `${siteBasis()}${BEDRIJF.logoAnimatie}`;
}

export function adresRegel(): string {
  return `${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.plaats}`;
}
