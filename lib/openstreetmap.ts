import "server-only";
import { bouwOverpassQuery, osmNaarRijen, type OverpassElement } from "@/lib/prospector/osm";
import type { ProspectRij } from "@/lib/prospector/types";

/**
 * OpenStreetMap als prospector-bron, via de Overpass API.
 *
 * De enige bron zonder sleutel, zonder account en zonder rekening: OSM is open
 * data. Daarmee is dit de bron om standaard mee te beginnen, en Apify of
 * Places pas als deze te weinig oplevert.
 *
 * Wat hij wél en niet vindt is precies andersom dan bij Google. OSM mist
 * bedrijven die zichzelf nooit hebben laten intekenen, maar vindt juist wél de
 * bedrijven die geen Google-vermelding onderhouden — en dat is vaak exact het
 * type dat nog handmatig werkt.
 *
 * Overpass draait op vrijwilligersservers met een eerlijk-gebruik-beleid: één
 * zoekopdracht tegelijk, een tijdslimiet in de query zelf, en een user-agent
 * waarin staat wie er langskomt.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter";
const TIMEOUT_MS = 40_000;

export async function zoekLeadsViaOpenStreetMap(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
}): Promise<ProspectRij[]> {
  const query = bouwOverpassQuery(opts);

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  let data: { elements?: OverpassElement[] };
  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ViesaProspector/1.0 (+https://www.viesa-automations.nl)",
      },
      body: new URLSearchParams({ data: query }),
    });

    if (res.status === 429 || res.status === 504) {
      throw new Error(
        "OpenStreetMap is op dit moment overbelast. Probeer het over een paar minuten opnieuw — " +
          "de dienst draait op vrijwilligersservers.",
      );
    }
    if (!res.ok) throw new Error(`OpenStreetMap gaf ${res.status}.`);
    data = (await res.json()) as { elements?: OverpassElement[] };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("OpenStreetMap antwoordde niet binnen veertig seconden.");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }

  return osmNaarRijen(data.elements ?? [], opts.maxResultaten);
}
