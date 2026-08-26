/**
 * Het pure parseerwerk achter lib/site-scrape.ts: HTML in, tekst uit.
 *
 * Bewust een eigen bestand zonder `server-only`. Dat is geen smaak maar een
 * eerder geleerde les: een module die `server-only` importeert is niet los te
 * testen met tsx, en juist dit stuk — welke koppen we wel en niet meenemen —
 * gaat stil fout. Zie scripts/test-site-scrape.mjs.
 */

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Haalt de leesbare tekst uit een stuk HTML: tags eruit, entiteiten vertaald. */
export function tekstVan(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rommel die vrijwel elke site in een kop of menu heeft staan, maar die niets
 * over het bedrijf zegt. Zonder deze filter komt "Cookie-instellingen" als
 * dienst in het prototype te staan.
 */
const RUIS =
  /(cookie|privacy|disclaimer|algemene voorwaarden|nieuwsbrief|inloggen|winkelwagen|zoeken|menu|skip|deel dit|volg ons|sitemap|copyright|©)/i;

/** De echte h1 van de pagina — de zin die het bedrijf zelf koos. */
export function vindKop(html: string): string | null {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  const tekst = tekstVan(m[1]);
  if (tekst.length < 3 || tekst.length > 120 || RUIS.test(tekst)) return null;
  return tekst;
}

/**
 * De koppen van de pagina met de tekst die eronder staat.
 *
 * Per h2/h3 kijken we naar het stuk HTML tot de volgende kop en pakken daar de
 * eerste alinea uit. Dat is grof, maar het levert precies wat we nodig hebben:
 * de eigen woorden van het bedrijf in plaats van onze verzonnen dienstteksten.
 */
export function vindSecties(html: string): { titel: string; tekst: string }[] {
  const koppen = Array.from(html.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi));
  const secties: { titel: string; tekst: string }[] = [];
  const gezien = new Set<string>();

  for (let i = 0; i < koppen.length && secties.length < 6; i++) {
    const titel = tekstVan(koppen[i][2]);
    if (titel.length < 3 || titel.length > 70 || RUIS.test(titel)) continue;

    const sleutel = titel.toLowerCase();
    if (gezien.has(sleutel)) continue;

    // Het stuk tussen deze kop en de volgende.
    const start = koppen[i].index! + koppen[i][0].length;
    const eind = i + 1 < koppen.length ? koppen[i + 1].index! : Math.min(html.length, start + 4000);
    const blok = html.slice(start, eind);

    const alinea = blok.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const tekst = alinea ? tekstVan(alinea[1]) : "";
    // Te kort is geen tekst maar een label; dan zegt de kop alleen niets.
    if (tekst.length < 30) continue;

    gezien.add(sleutel);
    secties.push({ titel, tekst: tekst.length > 200 ? `${tekst.slice(0, 197).trimEnd()}…` : tekst });
  }

  return secties;
}

/** De menu-items: de echte paginanamen van de site. */
export function vindNavigatie(html: string): string[] {
  const blok =
    html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ??
    html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i)?.[1] ??
    "";
  if (!blok) return [];

  const items: string[] = [];
  const gezien = new Set<string>();
  for (const m of Array.from(blok.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi))) {
    const tekst = tekstVan(m[1]);
    if (tekst.length < 2 || tekst.length > 24 || RUIS.test(tekst)) continue;
    const sleutel = tekst.toLowerCase();
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    items.push(tekst);
    if (items.length >= 6) break;
  }
  return items;
}
