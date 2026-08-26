import "server-only";
import { schoonSleutel } from "@/lib/geheimen";
import { bouwZoekopdracht, treffersNaarRijen, type ZoekTreffer } from "@/lib/prospector/websearch";
import type { ProspectRij } from "@/lib/prospector/types";

/**
 * Google Programmable Search als prospector-bron.
 *
 * Vindt precies wat Maps en Places missen: bedrijven zónder Google-vermelding.
 * Een groothandel die nooit een bedrijfsprofiel heeft aangemaakt staat niet op
 * de kaart, maar heeft wel een website — en dat is nu juist het type dat vaak
 * nog handmatig werkt.
 *
 * Wat je hier níét krijgt is adres, telefoon of openingstijden; een
 * zoekresultaat is een titel, een link en een stukje tekst. De lead komt dus
 * binnen met alleen een naam en een site, en dat is genoeg om te scannen.
 *
 * Twee env-vars, allebei uit de Google Cloud Console:
 *   GOOGLE_SEARCH_API_KEY  — Custom Search API ingeschakeld
 *   GOOGLE_SEARCH_CX       — de id van je zoekmachine (programmablesearchengine.google.com)
 * Honderd zoekopdrachten per dag zijn gratis; met tien resultaten per opdracht
 * is dat ruim duizend bedrijven per dag zonder rekening.
 */

const ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const PER_PAGINA = 10; // harde limiet van de API
const MAX_START = 91; // de API weigert start > 91 (resultaat 100 is de laatste)

type CseItem = { title?: string; link?: string; snippet?: string };
type CseResponse = { items?: CseItem[]; error?: { message?: string } };

export async function zoekLeadsViaGoogleZoeken(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
}): Promise<ProspectRij[]> {
  const { sleutel } = schoonSleutel(process.env.GOOGLE_SEARCH_API_KEY);
  const { sleutel: cx } = schoonSleutel(process.env.GOOGLE_SEARCH_CX);
  if (!sleutel) throw new Error("GOOGLE_SEARCH_API_KEY ontbreekt in de serverconfiguratie.");
  if (!cx) throw new Error("GOOGLE_SEARCH_CX ontbreekt in de serverconfiguratie.");

  const opdracht = bouwZoekopdracht(opts.zoekterm, opts.locatie);
  const treffers: ZoekTreffer[] = [];

  // Google levert tien resultaten per aanroep; doorbladeren tot we genoeg
  // hebben. Elke pagina telt als een aparte zoekopdracht voor het dagtegoed,
  // dus niet meer ophalen dan gevraagd.
  for (let start = 1; start <= MAX_START && treffers.length < opts.maxResultaten; start += PER_PAGINA) {
    const params = new URLSearchParams({
      key: sleutel,
      cx,
      q: opdracht,
      num: String(PER_PAGINA),
      start: String(start),
      hl: "nl",
    });

    const res = await fetch(`${ENDPOINT}?${params}`);
    if (!res.ok) {
      const melding =
        res.status === 429
          ? "Het gratis dagtegoed van Google Zoeken (100 opdrachten) is op. Morgen weer, of zet facturering aan."
          : res.status === 403
            ? "De sleutel wordt niet geaccepteerd. Staat de Custom Search API aan voor dit project?"
            : `Google Zoeken gaf ${res.status}.`;
      // Wat we al binnen hebben is bruikbaar; alleen bij nul resultaten is het
      // een echte fout waar de gebruiker iets aan moet doen.
      if (treffers.length > 0) break;
      throw new Error(melding);
    }

    const data = (await res.json()) as CseResponse;
    const items = data.items ?? [];
    if (items.length === 0) break; // geen resultaten meer

    for (const item of items) {
      if (!item.link) continue;
      treffers.push({
        titel: item.title ?? "",
        url: item.link,
        omschrijving: item.snippet ?? null,
      });
    }
  }

  return treffersNaarRijen(treffers, {
    maxResultaten: opts.maxResultaten,
    branche: opts.zoekterm,
  });
}
