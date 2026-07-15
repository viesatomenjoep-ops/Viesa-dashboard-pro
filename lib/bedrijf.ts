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

/** Absolute URL naar het logo (voor e-mail, waar relatieve paden niet werken). */
export function logoAbsoluut(): string {
  const basis =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://viesa-dashboard-pro.vercel.app";
  return `${basis}${BEDRIJF.logo}`;
}

export function adresRegel(): string {
  return `${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.plaats}`;
}
