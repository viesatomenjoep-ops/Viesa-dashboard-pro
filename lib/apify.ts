import "server-only";

/**
 * Apify-integratie voor de Google Maps-prospector: zoekt bedrijven op zoekterm +
 * locatie via de actor `compass/google-maps-extractor` en levert ze als
 * kant-en-klare lead-rijen op (zie lib/leads.ts).
 *
 * Vereist env-var APIFY_TOKEN (server-only, nooit NEXT_PUBLIC_).
 */

const ACTOR_ID = "2Mdma1N6Fd0y3QEjR"; // compass/google-maps-extractor

type ApifyPlaats = {
  title?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  website?: string;
  phone?: string;
  placeId?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  // Alleen aanwezig als scrapeContacts is ingeschakeld (betaalde add-on).
  emails?: string[];
  linkedIns?: string[];
  twitters?: string[];
};

export type ApifyLeadRij = {
  bedrijf: string;
  plaats: string | null;
  adres: string | null;
  land: string | null;
  website: string | null;
  telefoon: string | null;
  place_id: string | null;
  rating_google: number | null;
  aantal_reviews: number | null;
  branche: string | null;
  email: string | null;
  linkedin: string | null;
  twitter: string | null;
};

/** Zoekt plaatsen op Google Maps via Apify en zet ze om naar lead-rijen. */
export async function zoekLeadsViaGoogleMaps(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
  metContactverrijking?: boolean;
}): Promise<ApifyLeadRij[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN ontbreekt in de serverconfiguratie.");
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [opts.zoekterm],
        locationQuery: opts.locatie,
        maxCrawledPlacesPerSearch: Math.max(1, Math.min(100, opts.maxResultaten)),
        language: "nl",
        scrapeContacts: Boolean(opts.metContactverrijking),
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Apify-fout (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }

  const plaatsen = (await res.json()) as ApifyPlaats[];
  return plaatsen
    .filter((p) => p.title)
    .map((p) => ({
      bedrijf: p.title!.trim(),
      plaats: p.city ?? null,
      adres: p.address ?? p.street ?? null,
      land: landNaam(p.countryCode),
      website: p.website ?? null,
      telefoon: p.phone ?? null,
      place_id: p.placeId ?? null,
      rating_google: typeof p.totalScore === "number" ? p.totalScore : null,
      aantal_reviews: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
      branche: p.categoryName ?? null,
      email: p.emails?.[0] ?? null,
      linkedin: p.linkedIns?.[0] ?? null,
      twitter: p.twitters?.[0] ?? null,
    }));
}

function landNaam(countryCode?: string): string | null {
  if (!countryCode) return null;
  try {
    return new Intl.DisplayNames(["nl"], { type: "region" }).of(countryCode.toUpperCase()) ?? countryCode;
  } catch {
    return countryCode;
  }
}
