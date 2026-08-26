/**
 * Het gedeelde contract van alle prospector-bronnen.
 *
 * Elke bron — Apify, Google Places, OpenStreetMap, Google Zoeken, Claude —
 * levert dezelfde rij op. De aanroeper hoeft dus niet te weten waar een lead
 * vandaan komt, en een bron erbij zetten raakt alleen zijn eigen bestand.
 *
 * Bewust zonder `server-only`: de omzetters van elke bron worden apart getest
 * (scripts/test-prospector.mjs), en een module die `server-only` importeert is
 * met tsx niet te laden.
 */
export type ProspectRij = {
  bedrijf: string;
  plaats: string | null;
  adres: string | null;
  land: string | null;
  website: string | null;
  telefoon: string | null;
  /**
   * De sleutel waarop dubbele leads worden herkend. Google levert hier een
   * place-id; de andere bronnen zetten er hun eigen herkenbare sleutel neer
   * (`osm:node/123`, `web:voorbeeld.nl`) zodat ze dezelfde ontdubbeling
   * gebruiken zonder een extra kolom.
   */
  place_id: string | null;
  rating_google: number | null;
  aantal_reviews: number | null;
  branche: string | null;
  email: string | null;
  linkedin: string | null;
  twitter: string | null;
};

/** Een lege rij, zodat elke bron alleen hoeft in te vullen wat hij weet. */
export function legeRij(bedrijf: string): ProspectRij {
  return {
    bedrijf,
    plaats: null,
    adres: null,
    land: null,
    website: null,
    telefoon: null,
    place_id: null,
    rating_google: null,
    aantal_reviews: null,
    branche: null,
    email: null,
    linkedin: null,
    twitter: null,
  };
}

/** De hostnaam van een URL, zonder www — of null als het geen URL is. */
export function hostVanUrl(url: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Hosts die nooit een bedrijfssite zijn: sociale netwerken, marktplaatsen,
 * telefoongidsen en dergelijke.
 *
 * Zonder deze filter levert een webzoekopdracht vooral LinkedIn-pagina's en
 * Facebook-profielen op in plaats van bedrijven met een eigen site — en juist
 * die eigen site is wat we willen scannen.
 */
export const GEEN_BEDRIJFSSITE = [
  "facebook.com", "linkedin.com", "instagram.com", "x.com", "twitter.com",
  "youtube.com", "tiktok.com", "pinterest.com", "wikipedia.org", "google.com",
  "marktplaats.nl", "bol.com", "amazon.nl", "amazon.com", "ebay.nl",
  "telefoonboek.nl", "detelefoongids.nl", "goudengids.nl", "kvk.nl",
  "indeed.com", "indeed.nl", "glassdoor.com", "trustpilot.com",
  "yelp.com", "tripadvisor.nl", "tripadvisor.com", "booking.com",
  "openstreetmap.org", "yellowpages.com", "companyweb.be", "trendstop.be",
];

/** Is dit een eigen bedrijfssite, of een profiel op een platform? */
export function isBedrijfssite(host: string | null): boolean {
  if (!host) return false;
  return !GEEN_BEDRIJFSSITE.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * Een bedrijfsnaam uit een zoekresultaattitel.
 *
 * Zoekresultaten heten zelden alleen naar het bedrijf: er staat een streepje
 * met een slogan achter, of "| Home". Alles na het eerste scheidingsteken valt
 * weg, tenzij daarmee vrijwel niets overblijft.
 */
export function bedrijfsnaamUit(titel: string): string {
  const schoon = titel.replace(/\s+/g, " ").trim();
  const eerste = schoon.split(/\s[|·—–-]\s/)[0].trim();
  return eerste.length >= 3 ? eerste : schoon;
}
