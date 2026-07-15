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
} as const;

export function adresRegel(): string {
  return `${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.plaats}`;
}
