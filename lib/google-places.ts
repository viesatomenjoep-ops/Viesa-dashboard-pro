import "server-only";
import { schoonSleutel } from "@/lib/geheimen";
import type { ApifyLeadRij } from "@/lib/apify";

/**
 * Google Places API (New) als goedkoper alternatief voor de Apify-prospector.
 *
 * Zelfde contract als lib/apify.ts (ApifyLeadRij) — de aanroeper hoeft niet te
 * weten welke bron een resultaat leverde. Verschil met Apify: geen e-mail/
 * LinkedIn-verrijking (Places geeft dat niet terug), en Google's Text Search
 * geeft in de praktijk maximaal ~60 resultaten per zoekopdracht terug
 * (3 pagina's van 20), tegen Apify's tot 100.
 *
 * Vereist env-var GOOGLE_PLACES_API_KEY (server-only, nooit NEXT_PUBLIC_) —
 * een Google Cloud-sleutel met de "Places API (New)" ingeschakeld. Dat mag
 * dezelfde sleutel zijn als PAGESPEED_API_KEY als die geen restrictie heeft
 * die Places blokkeert; voor overzicht is een eigen sleutel wel aan te raden.
 */

const PAGINA_GROOTTE = 20;
const MAX_PAGINAS = 3; // Text Search (New) geeft doorgaans geen nextPageToken meer na ~60 resultaten.

const VELDEN = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

type PlacesAddressComponent = {
  longText?: string;
  types?: string[];
};

type PlacesPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: PlacesAddressComponent[];
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
};

type PlacesResponse = {
  places?: PlacesPlace[];
  nextPageToken?: string;
};

function component(p: PlacesPlace, type: string): string | null {
  return p.addressComponents?.find((c) => c.types?.includes(type))?.longText ?? null;
}

async function zoekPagina(
  sleutel: string,
  textQuery: string,
  pageToken?: string,
): Promise<PlacesResponse> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": sleutel,
      "X-Goog-FieldMask": VELDEN,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "nl",
      pageSize: PAGINA_GROOTTE,
      ...(pageToken ? { pageToken } : {}),
    }),
  });

  if (!res.ok) {
    const tekst = (await res.text()).slice(0, 300);
    if (res.status === 400 || res.status === 403) {
      throw new Error(
        "GOOGLE_PLACES_API_KEY wordt niet geaccepteerd — controleer of 'Places API (New)' " +
          `aanstaat voor deze sleutel. (${tekst})`,
      );
    }
    throw new Error(`Google Places-fout (${res.status}): ${tekst}`);
  }

  return (await res.json()) as PlacesResponse;
}

/** Zoekt bedrijven via Google Places (New) en zet ze om naar lead-rijen. */
export async function zoekLeadsViaGooglePlaces(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
}): Promise<ApifyLeadRij[]> {
  const { sleutel } = schoonSleutel(process.env.GOOGLE_PLACES_API_KEY);
  if (!sleutel) {
    throw new Error("GOOGLE_PLACES_API_KEY ontbreekt in de serverconfiguratie.");
  }

  const textQuery = `${opts.zoekterm} in ${opts.locatie}`;
  const gewenst = Math.max(1, Math.min(100, opts.maxResultaten));

  const alles: PlacesPlace[] = [];
  let pageToken: string | undefined;
  for (let pagina = 0; pagina < MAX_PAGINAS && alles.length < gewenst; pagina++) {
    const data = await zoekPagina(sleutel, textQuery, pageToken);
    alles.push(...(data.places ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return alles
    .slice(0, gewenst)
    .filter((p) => p.displayName?.text)
    .map((p) => ({
      bedrijf: p.displayName!.text!.trim(),
      plaats: component(p, "locality"),
      adres: p.formattedAddress ?? null,
      land: component(p, "country"),
      website: p.websiteUri ?? null,
      telefoon: p.internationalPhoneNumber ?? null,
      place_id: p.id ?? null,
      rating_google: typeof p.rating === "number" ? p.rating : null,
      aantal_reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      branche: p.primaryTypeDisplayName?.text ?? null,
      // Places geeft geen contactgegevens terug — dat blijft voorbehouden aan
      // de betaalde Apify-verrijking of aan lead-scout/prospect-dossier.
      email: null,
      linkedin: null,
      twitter: null,
    }));
}
