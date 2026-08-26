import { hostVanUrl, isBedrijfssite, legeRij, type ProspectRij } from "./types";

/**
 * Het pure deel van de OpenStreetMap-bron: de zoekopdracht opbouwen en het
 * antwoord omzetten naar leadrijen.
 *
 * Los van het netwerkdeel (lib/openstreetmap.ts) zodat het te testen is —
 * precies hier gaat het stil fout: een verkeerd samengestelde Overpass-query
 * levert geen foutmelding maar nul resultaten.
 */

/** Eén element uit een Overpass-antwoord. */
export type OverpassElement = {
  type?: string;
  id?: number;
  tags?: Record<string, string>;
};

/** Tekens die in een Overpass-reguliere expressie kwaad kunnen. */
function veiligVoorRegex(waarde: string): string {
  return waarde.replace(/[\\"^$.|?*+()[\]{}]/g, "").trim();
}

/**
 * Bouwt de Overpass-query.
 *
 * Vier zoeklijnen naast elkaar, want een bedrijfstype zit in OSM niet op één
 * plek: een winkel staat onder `shop`, een adviesbureau onder `office`, een
 * installateur onder `craft`, en wie geen van drieën gebruikt is soms alleen op
 * naam te vinden. Alle vier eisen `website`, want een lead zonder site kunnen
 * we niet scannen en is voor ons dus geen lead.
 */
export function bouwOverpassQuery(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
}): string {
  const term = veiligVoorRegex(opts.zoekterm);
  const plaats = veiligVoorRegex(opts.locatie).split(",")[0].trim();
  const limiet = Math.max(1, Math.min(200, Math.round(opts.maxResultaten)));

  const regels = ["shop", "office", "craft", "name"]
    .map((sleutel) => `  nwr(area.zoekgebied)["website"]["${sleutel}"~"${term}",i];`)
    .join("\n");

  return `[out:json][timeout:30];
area["name"~"^${plaats}$",i]["boundary"="administrative"]->.zoekgebied;
(
${regels}
);
out center ${limiet};`;
}

/** De branche uit de OSM-tags: de eerste die er staat, leesbaar gemaakt. */
function brancheVan(tags: Record<string, string>): string | null {
  for (const sleutel of ["shop", "office", "craft", "amenity", "industrial"]) {
    const waarde = tags[sleutel];
    if (waarde && waarde !== "yes") {
      return waarde.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    }
  }
  return null;
}

function adresVan(tags: Record<string, string>): string | null {
  const straat = tags["addr:street"];
  if (!straat) return null;
  const nummer = tags["addr:housenumber"];
  return nummer ? `${straat} ${nummer}` : straat;
}

/**
 * Zet een Overpass-antwoord om naar leadrijen.
 *
 * Elementen zonder naam of zonder bruikbare eigen website vallen af, en
 * dubbele domeinen tellen één keer — een keten met vijf vestigingen in dezelfde
 * stad is één lead, geen vijf.
 */
export function osmNaarRijen(elementen: OverpassElement[], maxResultaten: number): ProspectRij[] {
  const rijen: ProspectRij[] = [];
  const gezieneHosts = new Set<string>();

  for (const el of elementen) {
    if (rijen.length >= maxResultaten) break;
    const tags = el.tags ?? {};
    const naam = tags.name?.trim();
    if (!naam) continue;

    const ruweSite = tags.website ?? tags["contact:website"] ?? null;
    const host = ruweSite ? hostVanUrl(ruweSite) : null;
    if (!isBedrijfssite(host)) continue;
    if (host && gezieneHosts.has(host)) continue;
    if (host) gezieneHosts.add(host);

    const rij = legeRij(naam);
    rij.website = host ? `https://${host}` : null;
    rij.plaats = tags["addr:city"] ?? null;
    rij.adres = adresVan(tags);
    rij.land = tags["addr:country"] ?? null;
    rij.telefoon = tags.phone ?? tags["contact:phone"] ?? null;
    rij.email = tags.email ?? tags["contact:email"] ?? null;
    rij.branche = brancheVan(tags);
    // Eigen sleutel in hetzelfde veld als Google's place-id, zodat de
    // ontdubbeling in de actie ongewijzigd blijft werken.
    rij.place_id = el.type && el.id ? `osm:${el.type}/${el.id}` : null;
    rijen.push(rij);
  }

  return rijen;
}
