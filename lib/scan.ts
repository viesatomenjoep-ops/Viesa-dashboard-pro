import "server-only";
import { schoonSleutel } from "@/lib/geheimen";
import { analyseerGeo, type GeoAnalyse } from "@/lib/geo-analyse";
import type { AuditResultaten } from "@/lib/audit";
import { kiesTweedePagina, type PaginaMeting } from "@/lib/rapport/paginas";

/**
 * Websitescanner: haalt de site op, meet hem, en telt drie oordelen samen.
 *
 * De weging staat hieronder expliciet. AI-zichtbaarheid weegt het zwaarst omdat
 * dat is wat je verkoopt; GEO-gereedheid daarna omdat dat is wat je oplevert;
 * techniek als laatste omdat een snelle site die niemand noemt nog steeds
 * onzichtbaar is.
 */

export const WEGING = { zichtbaarheid: 40, geo: 35, techniek: 25 } as const;

/**
 * Eén audit uit het Lighthouse-rapport.
 *
 * `score` is 0 (gezakt), 1 (geslaagd) of null. `scoreDisplayMode` zegt of de
 * audit überhaupt beoordeeld is: "manual" en "notApplicable" betekenen dat
 * Lighthouse er géén uitspraak over doet — die horen bij de punten die we
 * eerlijk als niet-beoordeeld melden, niet bij de gezakte.
 */
export type LighthouseAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  details?: { items?: unknown[] };
};

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

/**
 * Het rapport zoals de streamende scanner ('m opbouwt): hetzelfde als
 * ScanResultaat, plus de losse checks die alleen in die route bestaan
 * (beveiliging, scripts, vindbaarheid) en de og:image-preview. Dit is wat er
 * bewaard wordt bij "push naar lead" en wat de PDF opbouwt — zonder de scan
 * opnieuw te hoeven draaien.
 */
export type ScanRapport = ScanResultaat & {
  beveiliging?: unknown;
  scripts?: unknown;
  vindbaarheid?: unknown;
  voorbeeld?: string | null;
  /**
   * De losse Lighthouse-audits. Hieruit komen toegankelijkheid en werking:
   * Lighthouse draait in een echte Chrome bij Google en meet daarmee ook
   * kleurcontrast, wat zonder gerenderde pagina niet kan.
   */
  audits?: Record<string, LighthouseAudit>;
  lighthouseVersie?: string | null;
  /** Wat elke opgevraagde pagina deed — het onderdeel "werking". */
  paginas?: PaginaMeting[];
  /** Herkende technologie uit de HTML en de headers. */
  technologie?: { groep: string; namen: string[] }[];
  /** Hoe lang de hele scan duurde, voor het herkomstblok. */
  rekentijdMs?: number;
};

const HAAL_TIMEOUT_MS = 15_000;

/** Vult een kaal domein aan tot een volledige URL. */
export function normaliseerUrl(invoer: string): string {
  const s = invoer.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

const CRAWLER_USER_AGENT =
  // Eerlijk zijn over wie er langskomt. Sommige sites weren onbekende clients;
  // een herkenbare naam met contactadres voorkomt blokkades en is bovendien
  // hoe een crawler zich hoort te melden.
  "ViesaAuditBot/1.0 (+https://www.viesa-automations.nl; contact@viesa-automations.nl)";

async function haalRuw(
  url: string,
  timeout = HAAL_TIMEOUT_MS,
): Promise<{ tekst: string; headers: Record<string, string>; ms: number; status: number }> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent": CRAWLER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    const ms = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k] = v));
    return { tekst: await res.text(), headers, ms, status: res.status };
  } finally {
    clearTimeout(t);
  }
}

async function haalTekst(url: string, timeout = HAAL_TIMEOUT_MS): Promise<string> {
  return (await haalRuw(url, timeout)).tekst;
}

export type SiteGegevens = {
  html: string;
  robotsTxt: string;
  llmsTxtGevonden: boolean;
  sitemapGevonden: boolean;
  headers: Record<string, string>;
  https: boolean;
  laadtijdMs: number;
  waarschuwingen: string[];
  /**
   * Elke pagina die we hebben opgevraagd, met wat eruit kwam.
   *
   * Twee in plaats van één: de homepage is meestal de best verzorgde pagina van
   * een site, dus daar alleen naar kijken vleit de klant. Een tweede,
   * willekeurige inhoudspagina laat zien hoe het er dagelijks aan toegaat.
   */
  paginas: PaginaMeting[];
};

/** Haalt pagina, robots.txt, llms.txt en sitemap op. Alleen de pagina is verplicht. */
export async function haalSite(url: string): Promise<SiteGegevens> {
  const basis = new URL(url).origin;
  const waarschuwingen: string[] = [];

  const [pagina, robots, llms, sitemap] = await Promise.allSettled([
    haalRuw(url),
    haalTekst(`${basis}/robots.txt`, 8000),
    haalTekst(`${basis}/llms.txt`, 8000),
    haalTekst(`${basis}/sitemap.xml`, 8000),
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

  // Een 404-pagina die HTML teruggeeft telt niet mee.
  const isEchteTekst = (v: string) => v.trim().length > 0 && !/^\s*<(!doctype|html)/i.test(v);
  const llmsTxtGevonden = llms.status === "fulfilled" && isEchteTekst(llms.value);
  const sitemapGevonden = sitemap.status === "fulfilled" && isEchteTekst(sitemap.value);

  const paginas: PaginaMeting[] = [
    {
      url,
      status: pagina.value.status,
      https: url.startsWith("https://"),
      laadtijdMs: pagina.value.ms,
    },
  ];

  // Een tweede pagina erbij, als de homepage ergens naartoe wijst. Mislukt dat,
  // dan meten we er één en zegt het rapport dat ook — beter dan doen alsof.
  const tweede = kiesTweedePagina(pagina.value.tekst, url);
  if (tweede) {
    try {
      const res = await haalRuw(tweede, 10_000);
      paginas.push({
        url: tweede,
        status: res.status,
        https: tweede.startsWith("https://"),
        laadtijdMs: res.ms,
      });
    } catch (e) {
      paginas.push({
        url: tweede,
        status: null,
        https: tweede.startsWith("https://"),
        laadtijdMs: null,
        fout: e instanceof Error ? e.message : "Niet op te halen.",
      });
    }
  }

  return {
    html: pagina.value.tekst,
    robotsTxt,
    llmsTxtGevonden,
    sitemapGevonden,
    headers: pagina.value.headers,
    https: url.startsWith("https://"),
    laadtijdMs: pagina.value.ms,
    waarschuwingen,
    paginas,
  };
}

/**
 * PageSpeed Insights. Zonder sleutel werkt het ook, maar met een strenge
 * limiet — vandaar dat de sleutel wordt aanbevolen en niet vereist.
 */
export type PagespeedUitkomst = {
  scores: PagespeedScores;
  /**
   * De losse audits, ongefilterd.
   *
   * Hier zit het echte werk in: Lighthouse draait in Google's Chrome en voert
   * daarmee de volledige toegankelijkheidscontrole uit, inclusief kleurcontrast
   * — iets wat je zonder browser niet kunt meten. Wij hoeven dus geen eigen
   * browser te draaien, we moeten alleen ophouden deze gegevens weg te gooien.
   */
  audits: Record<string, LighthouseAudit>;
  /** De versie van het meetinstrument, voor het herkomstblok in het rapport. */
  lighthouseVersie: string | null;
  fout?: string;
};

export async function meetPagespeed(url: string): Promise<PagespeedUitkomst> {
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
      return { scores: leeg, audits: {}, lighthouseVersie: null, fout: melding };
    }

    const data = (await res.json()) as {
      lighthouseResult?: {
        lighthouseVersion?: string;
        categories?: Record<string, { score?: number | null }>;
        audits?: Record<string, LighthouseAudit>;
      };
    };
    const cat = data.lighthouseResult?.categories ?? {};
    const naar100 = (v?: number | null) =>
      typeof v === "number" ? Math.round(v * 100) : null;

    const audits = data.lighthouseResult?.audits ?? {};

    return {
      lighthouseVersie: data.lighthouseResult?.lighthouseVersion ?? null,
      audits,
      scores: {
        prestatie: naar100(cat.performance?.score),
        seo: naar100(cat.seo?.score),
        toegankelijkheid: naar100(cat.accessibility?.score),
        bestPractices: naar100(cat["best-practices"]?.score),
        lcp: audits["largest-contentful-paint"]?.numericValue
          ? Math.round((audits["largest-contentful-paint"].numericValue! / 1000) * 10) / 10
          : null,
      },
    };
  } catch (e) {
    const afgebroken = e instanceof Error && e.name === "AbortError";
    return {
      scores: leeg,
      audits: {},
      lighthouseVersie: null,
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
