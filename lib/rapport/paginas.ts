/**
 * Welke tweede pagina we naast de homepage meten.
 *
 * Eén pagina meten en daar uitspraken over de hele winkel op baseren is niet
 * eerlijk: de homepage is meestal de best verzorgde pagina van de site. Een
 * product- of dienstenpagina laat zien hoe het er dagelijks aan toegaat.
 *
 * Puur, dus testbaar — precies het soort keuze dat stil fout gaat: een link
 * naar een PDF, een taalwissel of de winkelwagen ziet er in de HTML hetzelfde
 * uit als een echte inhoudspagina.
 */

/** Paden die niets over de inhoud van de winkel zeggen. */
const ONINTERESSANT =
  /(winkelwagen|cart|checkout|account|inloggen|login|register|privacy|cookie|voorwaarden|disclaimer|sitemap|zoeken|search|feed|rss)/i;

/** Bestanden zijn geen pagina's. */
const BESTAND = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|mp4|mp3|ico|css|js)(\?|#|$)/i;

/** Paden die juist wél laten zien wat een bedrijf doet, in volgorde van voorkeur. */
const INTERESSANT = [
  /(product|artikel|shop|winkel|assortiment|collectie)/i,
  /(dienst|service|aanbod|oplossing|wat-we-doen)/i,
  /(over-ons|over|about|wie-zijn-wij)/i,
  /(contact)/i,
];

/**
 * Kiest de tweede te meten pagina uit de links op de homepage.
 *
 * Geeft null als er niets bruikbaars is; dan meten we één pagina en zegt het
 * rapport dat ook, in plaats van te doen alsof er twee gemeten zijn.
 */
export function kiesTweedePagina(html: string, basisUrl: string): string | null {
  let basis: URL;
  try {
    basis = new URL(basisUrl);
  } catch {
    return null;
  }

  const kandidaten: string[] = [];
  const gezien = new Set<string>([basis.toString(), `${basis.toString()}/`]);

  for (const m of Array.from(html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi))) {
    const ruw = m[1].trim();
    if (!ruw || ruw.startsWith("#") || /^(mailto|tel|javascript):/i.test(ruw)) continue;

    let url: URL;
    try {
      url = new URL(ruw, basis);
    } catch {
      continue;
    }

    // Alleen dezelfde site: een link naar een leverancier zegt niets over deze winkel.
    if (url.host !== basis.host) continue;
    if (BESTAND.test(url.pathname)) continue;
    if (ONINTERESSANT.test(url.pathname)) continue;

    url.hash = "";
    const schoon = url.toString();
    // De homepage zelf telt niet als tweede pagina.
    if (url.pathname === "/" || url.pathname === "") continue;
    if (gezien.has(schoon)) continue;
    gezien.add(schoon);
    kandidaten.push(schoon);
  }

  if (kandidaten.length === 0) return null;

  // Eerst kijken of er een pagina bij zit die laat zien wat ze verkopen.
  for (const patroon of INTERESSANT) {
    const treffer = kandidaten.find((k) => patroon.test(new URL(k).pathname));
    if (treffer) return treffer;
  }

  // Anders gewoon de eerste interne link; dat is nog altijd een echte pagina.
  return kandidaten[0];
}

/** Wat we per gemeten pagina vastleggen — het "werking"-onderdeel. */
export type PaginaMeting = {
  url: string;
  status: number | null;
  /** Kwam de pagina binnen via https? */
  https: boolean;
  laadtijdMs: number | null;
  /** Ingevuld als de pagina helemaal niet op te halen was. */
  fout?: string;
};

/** Werkt deze pagina zoals hij hoort? */
export function paginaWerkt(m: PaginaMeting): boolean {
  return m.status !== null && m.status >= 200 && m.status < 400 && m.https && !m.fout;
}

/**
 * Het cijfer voor werking: het aandeel pagina's dat het gewoon doet.
 *
 * Null als er niets te meten viel — dat wordt een streepje in het rapport, geen
 * nul, want een mislukte meting is geen kapotte site.
 */
export function werkingScore(metingen: PaginaMeting[]): number | null {
  if (metingen.length === 0) return null;
  const goed = metingen.filter(paginaWerkt).length;
  return Math.round((goed / metingen.length) * 100);
}
