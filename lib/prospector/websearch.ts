import {
  bedrijfsnaamUit,
  hostVanUrl,
  isBedrijfssite,
  legeRij,
  type ProspectRij,
} from "./types";

/**
 * Het pure deel van de zoekmachine-bronnen: van zoekresultaten naar leadrijen.
 *
 * Gedeeld door Google Zoeken en de Claude-variant, want beide leveren
 * hetzelfde: een titel, een link en een stukje omschrijving. Alleen de manier
 * waarop die resultaten tot stand komen verschilt.
 */

export type ZoekTreffer = {
  titel: string;
  url: string;
  omschrijving?: string | null;
};

/**
 * Zet zoekresultaten om naar leadrijen.
 *
 * Twee dingen gebeuren hier die het verschil maken tussen een bruikbare lijst
 * en ruis. Profielpagina's op platforms vallen af — een LinkedIn-pagina is geen
 * site die we kunnen scannen. En per domein blijft één rij over: tien
 * treffers op dezelfde site zijn één bedrijf, geen tien leads.
 */
export function treffersNaarRijen(
  treffers: ZoekTreffer[],
  opts: { maxResultaten: number; branche?: string | null; land?: string | null } = { maxResultaten: 20 },
): ProspectRij[] {
  const rijen: ProspectRij[] = [];
  const gezien = new Set<string>();

  for (const treffer of treffers) {
    if (rijen.length >= opts.maxResultaten) break;

    const host = hostVanUrl(treffer.url ?? "");
    if (!isBedrijfssite(host)) continue;
    if (!host || gezien.has(host)) continue;
    gezien.add(host);

    const naam = bedrijfsnaamUit(treffer.titel ?? "").trim();
    if (naam.length < 2) continue;

    const rij = legeRij(naam);
    rij.website = `https://${host}`;
    rij.branche = opts.branche ?? null;
    rij.land = opts.land ?? null;
    // Eigen sleutel in het place_id-veld, zodat dezelfde ontdubbeling werkt als
    // bij Google: het domein is hier de identiteit van het bedrijf.
    rij.place_id = `web:${host}`;
    rijen.push(rij);
  }

  return rijen;
}

/**
 * De zoekopdracht voor een zoekmachine.
 *
 * `-site:` sluit de grootste platforms uit bij de bron in plaats van pas bij het
 * filteren: dat scheelt resultaten die anders de hele eerste pagina vullen.
 */
export function bouwZoekopdracht(zoekterm: string, locatie: string): string {
  const uitgesloten = ["linkedin.com", "facebook.com", "indeed.com", "marktplaats.nl"]
    .map((h) => `-site:${h}`)
    .join(" ");
  return `${zoekterm} ${locatie} ${uitgesloten}`.replace(/\s+/g, " ").trim();
}
