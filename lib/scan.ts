import "server-only";
import { schoonSleutel } from "@/lib/geheimen";
import { analyseerGeo, type GeoAnalyse } from "@/lib/geo-analyse";
import type { AuditResultaten } from "@/lib/audit";

/**
 * Websitescanner: haalt de site op, meet hem, en telt drie oordelen samen.
 *
 * De weging staat hieronder expliciet. AI-zichtbaarheid weegt het zwaarst omdat
 * dat is wat je verkoopt; GEO-gereedheid daarna omdat dat is wat je oplevert;
 * techniek als laatste omdat een snelle site die niemand noemt nog steeds
 * onzichtbaar is.
 */

export const WEGING = { zichtbaarheid: 40, geo: 35, techniek: 25 } as const;

export type PagespeedScores = {
  prestatie: number | null;
  seo: number | null;
  toegankelijkheid: number | null;
  bestPractices: number | null;
  /** Laadtijd in seconden (Largest Contentful Paint). */
  lcp: number | null;
};

export type ScanResultaat = {
  url: string;
  host: string;
  niche: string | null;
  paginatitel: string | null;
  totaalScore: number;
  geo: GeoAnalyse;
  techniek: { score: number | null; scores: PagespeedScores; fout?: string };
  zichtbaarheid: {
    score: number | null;
    gevonden: number;
    getest: number;
    resultaten: AuditResultaten | null;
    fout?: string;
  };
  waarschuwingen: string[];
};

const HAAL_TIMEOUT_MS = 15_000;

/** Vult een kaal domein aan tot een volledige URL. */
export function normaliseerUrl(invoer: string): string {
  const s = invoer.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

async function haalTekst(url: string, timeout = HAAL_TIMEOUT_MS): Promise<string> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        // Eerlijk zijn over wie er langskomt. Sommige sites weren onbekende
        // clients; een herkenbare naam met contactadres voorkomt blokkades en
        // is bovendien hoe een crawler zich hoort te melden.
        "User-Agent":
          "ViesaAuditBot/1.0 (+https://www.viesa-automations.nl; contact@viesa-automations.nl)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Haalt pagina, robots.txt en llms.txt op. Alleen de pagina is verplicht. */
export async function haalSite(url: string): Promise<{
  html: string;
  robotsTxt: string;
  llmsTxtGevonden: boolean;
  waarschuwingen: string[];
}> {
  const basis = new URL(url).origin;
  const waarschuwingen: string[] = [];

  const [pagina, robots, llms] = await Promise.allSettled([
    haalTekst(url),
    haalTekst(`${basis}/robots.txt`, 8000),
    haalTekst(`${basis}/llms.txt`, 8000),
  ]);

  if (pagina.status === "rejected") {
    throw new Error(
      `De pagina is niet op te halen (${pagina.reason instanceof Error ? pagina.reason.message : "onbekend"}). ` +
        "Mogelijk blokkeert de site geautomatiseerd verkeer — dan zien de AI-crawlers dit ook.",
    );
  }

  // Geen robots.txt is geen fout: dan is er niets geblokkeerd.
  const robotsTxt = robots.status === "fulfilled" ? robots.value : "";
  if (robots.status === "rejected") {
    waarschuwingen.push("robots.txt niet gevonden — er wordt dus niets geweerd.");
  }

  // Een 404-pagina die HTML teruggeeft telt niet als llms.txt.
  const llmsTxtGevonden =
    llms.status === "fulfilled" &&
    llms.value.trim().length > 0 &&
    !/^\s*<(!doctype|html)/i.test(llms.value);

  return { html: pagina.value, robotsTxt, llmsTxtGevonden, waarschuwingen };
}

/**
 * PageSpeed Insights. Zonder sleutel werkt het ook, maar met een strenge
 * limiet — vandaar dat de sleutel wordt aanbevolen en niet vereist.
 */
export async function meetPagespeed(
  url: string,
): Promise<{ scores: PagespeedScores; fout?: string }> {
  const leeg: PagespeedScores = {
    prestatie: null,
    seo: null,
    toegankelijkheid: null,
    bestPractices: null,
    lcp: null,
  };

  const { sleutel } = schoonSleutel(process.env.PAGESPEED_API_KEY);
  const params = new URLSearchParams({ url, strategy: "mobile" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", c);
  }
  if (sleutel) params.set("key", sleutel);

  const ac = new AbortController();
  // Lighthouse doet er echt even over; korter afkappen levert alleen ruis op.
  const t = setTimeout(() => ac.abort(), 60_000);
  try {
    const res = await fetch(
      `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: ac.signal },
    );
    if (!res.ok) {
      const melding =
        res.status === 400 || res.status === 403
          ? sleutel
            ? "PAGESPEED_API_KEY wordt niet geaccepteerd."
            : "Zonder PAGESPEED_API_KEY is de limiet snel bereikt."
          : res.status === 429
            ? "Aanvraaglimiet van PageSpeed bereikt."
            : `PageSpeed gaf ${res.status}.`;
      return { scores: leeg, fout: melding };
    }

    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: Record<string, { score?: number | null }>;
        audits?: Record<string, { numericValue?: number }>;
      };
    };
    const cat = data.lighthouseResult?.categories ?? {};
    const naar100 = (v?: number | null) =>
      typeof v === "number" ? Math.round(v * 100) : null;

    return {
      scores: {
        prestatie: naar100(cat.performance?.score),
        seo: naar100(cat.seo?.score),
        toegankelijkheid: naar100(cat.accessibility?.score),
        bestPractices: naar100(cat["best-practices"]?.score),
        lcp: data.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue
          ? Math.round(
              (data.lighthouseResult.audits["largest-contentful-paint"].numericValue / 1000) * 10,
            ) / 10
          : null,
      },
    };
  } catch (e) {
    const afgebroken = e instanceof Error && e.name === "AbortError";
    return {
      scores: leeg,
      fout: afgebroken ? "PageSpeed antwoordde niet binnen een minuut." : "PageSpeed niet bereikbaar.",
    };
  } finally {
    clearTimeout(t);
  }
}

/** Het technische cijfer: het gemiddelde van de Lighthouse-categorieën. */
export function techniekScore(s: PagespeedScores): number | null {
  const waarden = [s.prestatie, s.seo, s.toegankelijkheid, s.bestPractices].filter(
    (v): v is number => typeof v === "number",
  );
  if (waarden.length === 0) return null;
  return Math.round(waarden.reduce((a, b) => a + b, 0) / waarden.length);
}

/**
 * Telt de drie oordelen samen tot één cijfer.
 *
 * Ontbreekt een onderdeel — geen niche opgegeven, PageSpeed eruit — dan wordt
 * er herwogen over wat er wél is, in plaats van een nul mee te tellen. Anders
 * krijgt een prima site een onverdiend laag cijfer omdat een dienst haperde.
 */
export function totaalScore(delen: {
  zichtbaarheid: number | null;
  geo: number;
  techniek: number | null;
}): number {
  const posten: { waarde: number; gewicht: number }[] = [
    { waarde: delen.geo, gewicht: WEGING.geo },
  ];
  if (delen.zichtbaarheid !== null) {
    posten.push({ waarde: delen.zichtbaarheid, gewicht: WEGING.zichtbaarheid });
  }
  if (delen.techniek !== null) {
    posten.push({ waarde: delen.techniek, gewicht: WEGING.techniek });
  }
  const gewicht = posten.reduce((s, p) => s + p.gewicht, 0);
  if (gewicht === 0) return 0;
  return Math.round(posten.reduce((s, p) => s + p.waarde * p.gewicht, 0) / gewicht);
}

/** Vertaalt een cijfer naar een oordeel dat je hardop kunt zeggen. */
export function oordeel(score: number): { label: string; toon: "groen" | "amber" | "rood" } {
  if (score >= 75) return { label: "Goed zichtbaar", toon: "groen" };
  if (score >= 50) return { label: "Matig zichtbaar", toon: "amber" };
  return { label: "Vrijwel onzichtbaar", toon: "rood" };
}

export { analyseerGeo };
