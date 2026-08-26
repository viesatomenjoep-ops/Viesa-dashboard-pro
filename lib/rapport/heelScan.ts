import type { ScanRapport, PagespeedScores } from "@/lib/scan";

/**
 * Maakt een bewaarde scan heel voordat het rapport hem leest.
 *
 * Waarom dit bestaat: `website_scans.rapport` is een JSON-kolom. Wat daar in
 * staat is geschreven door de scanner van *toen*, niet door de scanner van nu.
 * Een veld dat er later bij kwam ontbreekt in oude rijen, en `JSON.stringify`
 * gooit elke `undefined` sleutel er sowieso uit — dus zelfs een scan van
 * vandaag kan terugkomen met minder velden dan het type belooft.
 *
 * Dat ging mis: `rapportVanScan` controleerde op `scores.lcp === null`, maar
 * een ontbrekende sleutel leest als `undefined`. Die controle liet 'm door en
 * de volgende regel riep `.toLocaleString()` aan op niets. Het rapport klapte
 * er dan uit met "a client-side exception has occurred", en de klant zag een
 * lege pagina in plaats van zijn scan.
 *
 * De regel die daaruit volgt: het rapport vertrouwt het type van de JSON-kolom
 * niet. Alles wat eruit komt gaat hier eerst langs, en krijgt een `null` waar
 * een meting ontbreekt — nooit een nul, want dat zou lezen als een slechte
 * uitslag in plaats van als een ontbrekende meting.
 */

const LEGE_SCORES: PagespeedScores = {
  prestatie: null,
  seo: null,
  toegankelijkheid: null,
  bestPractices: null,
  lcp: null,
};

/** `undefined` en niet-getallen worden `null`; een echt getal blijft staan. */
function getalOfNull(waarde: unknown): number | null {
  return typeof waarde === "number" && Number.isFinite(waarde) ? waarde : null;
}

function tekstOfNull(waarde: unknown): string | null {
  return typeof waarde === "string" && waarde.trim() !== "" ? waarde : null;
}

function lijst<T>(waarde: unknown): T[] {
  return Array.isArray(waarde) ? (waarde as T[]) : [];
}

function object(waarde: unknown): Record<string, unknown> {
  return waarde && typeof waarde === "object" && !Array.isArray(waarde)
    ? (waarde as Record<string, unknown>)
    : {};
}

export function heelScan(ruw: unknown): ScanRapport {
  const s = object(ruw);
  const techniek = object(s.techniek);
  const scores = object(techniek.scores);
  const zichtbaarheid = object(s.zichtbaarheid);

  return {
    url: tekstOfNull(s.url) ?? "",
    host: tekstOfNull(s.host) ?? tekstOfNull(s.url) ?? "onbekend",
    niche: tekstOfNull(s.niche),
    paginatitel: tekstOfNull(s.paginatitel),
    // Het totaal mag null zijn; het rapport toont dan een streepje in plaats
    // van een cijfer dat er niet is.
    totaalScore: getalOfNull(s.totaalScore) as ScanRapport["totaalScore"],

    geo: {
      ...(object(s.geo) as unknown as ScanRapport["geo"]),
      score: getalOfNull(object(s.geo).score) ?? 0,
      bevindingen: lijst(object(s.geo).bevindingen),
    },

    techniek: {
      score: getalOfNull(techniek.score),
      scores: {
        ...LEGE_SCORES,
        prestatie: getalOfNull(scores.prestatie),
        seo: getalOfNull(scores.seo),
        toegankelijkheid: getalOfNull(scores.toegankelijkheid),
        bestPractices: getalOfNull(scores.bestPractices),
        lcp: getalOfNull(scores.lcp),
      },
      fout: tekstOfNull(techniek.fout) ?? undefined,
    },

    zichtbaarheid: {
      score: getalOfNull(zichtbaarheid.score),
      gevonden: getalOfNull(zichtbaarheid.gevonden) ?? 0,
      getest: getalOfNull(zichtbaarheid.getest) ?? 0,
      // De vier modelresultaten blijven zoals ze zijn — `heelModellen`
      // hieronder vult per model aan wat er mist.
      resultaten: heelModellen(zichtbaarheid.resultaten),
      fout: tekstOfNull(zichtbaarheid.fout) ?? undefined,
    },

    waarschuwingen: lijst<string>(s.waarschuwingen).filter((w) => typeof w === "string"),

    beveiliging: s.beveiliging ?? undefined,
    scripts: s.scripts ?? undefined,
    vindbaarheid: s.vindbaarheid ?? undefined,
    voorbeeld: tekstOfNull(s.voorbeeld),
    audits: (s.audits ?? undefined) as ScanRapport["audits"],
    lighthouseVersie: tekstOfNull(s.lighthouseVersie),
    paginas: (lijst(s.paginas) as ScanRapport["paginas"]) ?? [],
    technologie: lijst<{ groep: string; namen: string[] }>(s.technologie).filter(
      (t) => t && typeof t.groep === "string" && Array.isArray(t.namen),
    ),
    rekentijdMs: getalOfNull(s.rekentijdMs) ?? undefined,
  };
}

/**
 * De vier modeluitkomsten van de AI-zichtbaarheid.
 *
 * Een uitkomst zonder `competitors` liet het rapport struikelen op
 * `.competitors.length`. Een model dat helemaal ontbreekt (bijvoorbeeld omdat
 * de cache alleen de geslaagde modellen bewaarde) wordt hier een nette
 * "geen antwoord" in plaats van een gat.
 */
function heelModellen(ruw: unknown): ScanRapport["zichtbaarheid"]["resultaten"] {
  if (!ruw || typeof ruw !== "object") return null;
  const bron = ruw as Record<string, unknown>;

  const heel = (naam: string) => {
    const m = object(bron[naam]);
    const gelukt = m.success === true;
    return {
      success: gelukt,
      target_found: m.target_found === true,
      competitors: lijst<{ name: string; url?: string }>(m.competitors).filter(
        (c) => c && typeof c.name === "string",
      ),
      error: tekstOfNull(m.error) ?? (gelukt ? undefined : "Geen antwoord"),
      raw: typeof m.raw === "string" ? m.raw : undefined,
    };
  };

  return {
    openai: heel("openai"),
    anthropic: heel("anthropic"),
    gemini: heel("gemini"),
    perplexity: heel("perplexity"),
  } as ScanRapport["zichtbaarheid"]["resultaten"];
}
