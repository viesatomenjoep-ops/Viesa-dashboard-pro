import "server-only";

/**
 * Haalt écht beeld en tekst van de bestaande site van een lead op — geen AI,
 * puur een fetch + wat regex-parsing, dus nog steeds 0 tokens. Gebruikt door
 * de branchesjablonen om het prototype op maat te maken: hun eigen foto in
 * plaats van een generiek kleurvlak, hun eigen paginatitel als extra regel.
 *
 * Best-effort en met een harde tijdslimiet — lukt het niet (site traag,
 * blokkeert bots, geen afbeeldingen), dan valt het sjabloon terug op het
 * generieke branche-ontwerp. Dat kost een paar seconden wachttijd in plaats
 * van instant, maar nog altijd geen geld.
 */

export type SiteEchtContent = {
  titel: string | null;
  beschrijving: string | null;
  /** Absolute URL's, og:image eerst, gededuped, logo/icoon-achtige weggefilterd. */
  afbeeldingen: string[];
};

const TIMEOUT_MS = 6000;
const MAX_AFBEELDINGEN = 6;

/** Bestandsnaampatronen die vrijwel nooit een goede heldenfoto zijn. */
const UITGESLOTEN = /(logo|icon|favicon|sprite|pixel|spacer|placeholder|avatar|badge)/i;

function absoluut(src: string, basis: string): string | null {
  try {
    return new URL(src, basis).toString();
  } catch {
    return null;
  }
}

function metaContent(html: string, patroon: RegExp): string | null {
  const m = html.match(patroon);
  return m ? m[1].trim() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Haalt best-effort echte content van een website op (fetch + parsing, geen AI). */
export async function haalEchteContent(url: string): Promise<SiteEchtContent> {
  const leeg: SiteEchtContent = { titel: null, beschrijving: null, afbeeldingen: [] };
  const net = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  let html: string;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(net, {
      signal: controller.signal,
      headers: { "user-agent": "ViesaBot/1.0 (+website-prototype)" },
    });
    clearTimeout(t);
    if (!res.ok) return leeg;
    html = await res.text();
  } catch {
    return leeg;
  }

  const ogTitel = metaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const titelTag = metaContent(html, /<title[^>]*>([^<]+)<\/title>/i);
  const titel = decodeEntities(ogTitel ?? titelTag ?? "").trim() || null;

  const beschrijving = decodeEntities(
    metaContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
      metaContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
      "",
  ).trim() || null;

  const kandidaten: string[] = [];
  const ogImage = metaContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage) kandidaten.push(ogImage);

  for (const m of Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))) {
    kandidaten.push(m[1]);
  }

  const gezien = new Set<string>();
  const afbeeldingen: string[] = [];
  for (const ruw of kandidaten) {
    if (afbeeldingen.length >= MAX_AFBEELDINGEN) break;
    if (/^data:/i.test(ruw)) continue;
    if (/\.svg(\?|#|$)/i.test(ruw)) continue;
    if (UITGESLOTEN.test(ruw)) continue;
    const abs = absoluut(ruw, net);
    if (!abs || gezien.has(abs)) continue;
    gezien.add(abs);
    afbeeldingen.push(abs);
  }

  return { titel, beschrijving, afbeeldingen };
}
