/**
 * Kern van de AI Visibility Audit: types, de parser en de domeinvergelijking.
 *
 * Bewust los van de route. Next.js staat in een route-bestand alleen
 * HTTP-handlers en configuratie-exports toe, en deze functies wil je apart
 * kunnen testen — het zijn precies de stukken die stil fout gaan.
 */

export type Concurrent = { name: string; url: string };

export type ModelUitkomst = {
  success: boolean;
  target_found: boolean;
  competitors: Concurrent[];
  /** Alleen gevuld als het model niet antwoordde. */
  error?: string;
};

export type AuditResultaten = {
  openai: ModelUitkomst;
  anthropic: ModelUitkomst;
  gemini: ModelUitkomst;
  perplexity: ModelUitkomst;
};

type ModelSleutel = keyof AuditResultaten;

/** De opdracht die elk model letterlijk krijgt. */
export function systeemOpdracht(niche: string): string {
  return `Identify the top 5 highly recommended companies or services for the following niche: ${niche}. Return ONLY a raw JSON object with an array 'competitors' containing objects with 'name' and 'url'.`;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Haalt de concurrentenlijst uit een modelantwoord.
 *
 * "Return ONLY raw JSON" is een verzoek, geen garantie. Modellen zetten er een
 * ```json-blok omheen, schrijven een inleidende zin, of geven een kale array
 * terug in plaats van een object. Alle drie worden hier opgevangen; wat er dan
 * nog niet uitkomt, is echt onbruikbaar.
 */
export function parseConcurrenten(ruw: string): Concurrent[] {
  if (!ruw?.trim()) return [];

  // Markdown-hekjes eraf.
  let tekst = ruw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  // Snijd inleidende en afsluitende praat weg. Kijk naar wélk haakje het eerst
  // komt: bij een kale array `[{...}]` zou blind op `{` snijden precies het
  // eerste element eruit lichten en de rest weggooien.
  const objStart = tekst.indexOf("{");
  const arrStart = tekst.indexOf("[");
  const arrEerst = arrStart !== -1 && (objStart === -1 || arrStart < objStart);

  const start = arrEerst ? arrStart : objStart;
  const eind = arrEerst ? tekst.lastIndexOf("]") : tekst.lastIndexOf("}");
  if (start !== -1 && eind > start) tekst = tekst.slice(start, eind + 1);

  let data: unknown;
  try {
    data = JSON.parse(tekst);
  } catch {
    return [];
  }

  // Zowel { competitors: [...] } als een kale array accepteren.
  const lijst: unknown = Array.isArray(data)
    ? data
    : (data as { competitors?: unknown })?.competitors;
  if (!Array.isArray(lijst)) return [];

  return lijst
    .map((c) => {
      const r = c as Record<string, unknown>;
      const name = String(r?.name ?? r?.company ?? "").trim();
      const url = String(r?.url ?? r?.website ?? r?.link ?? "").trim();
      return { name, url };
    })
    .filter((c) => c.name || c.url)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Domeinvergelijking
// ---------------------------------------------------------------------------

/** Kale hostnaam: zonder protocol, zonder www, zonder pad, kleine letters. */
export function hostVan(waarde: string): string {
  if (!waarde) return "";
  let s = waarde.trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // protocol
  s = s.split(/[/?#]/)[0]; // pad, query, anker
  s = s.split("@").pop() ?? s; // eventuele inloggegevens
  s = s.split(":")[0]; // poort
  s = s.replace(/^www\./, "").replace(/\.$/, "");
  return s;
}

/**
 * Staat het doeldomein tussen de genoemde concurrenten?
 *
 * Vergelijkt op hostnaam, niet op de hele URL: een model dat
 * "https://www.viesa-automations.nl/diensten" noemt, bedoelt hetzelfde bedrijf
 * als "viesa-automations.nl". Subdomeinen tellen aan beide kanten mee.
 */
export function doelGevonden(targetUrl: string, concurrenten: Concurrent[]): boolean {
  const doel = hostVan(targetUrl);
  if (!doel) return false;

  return concurrenten.some((c) => {
    const kandidaten = [hostVan(c.url), hostVan(c.name)].filter(Boolean);
    return kandidaten.some(
      (h) => h === doel || h.endsWith(`.${doel}`) || doel.endsWith(`.${h}`),
    );
  });
}
