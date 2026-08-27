/**
 * Het uitpakken van de schermafdruk uit een Lighthouse-antwoord.
 *
 * Apart en puur, want het is precies het soort code dat stil faalt: Google
 * verplaatst zo'n veld weleens tussen versies, en dan krijg je geen fout maar
 * een leeg laptopbeeld — waarna een klant een rapport opent met "geen
 * schermafdruk beschikbaar" op de omslag. Dat is hier gebeurd.
 *
 * Zonder `server-only`, zodat scripts/test-scan-afdruk.mjs 'm langs de
 * vormen kan halen die we in het wild tegenkomen.
 */

/** Het stukje Lighthouse-antwoord waar een schermafdruk in kan zitten. */
export type LighthouseBeeld = {
  audits?: Record<string, { details?: { data?: unknown } | null } | null> | null;
  fullPageScreenshot?: { screenshot?: { data?: unknown } | null } | null;
};

/**
 * Kiest de bruikbare schermafdruk uit een Lighthouse-antwoord.
 *
 * Volgorde is bewust: `final-screenshot` is het beeld boven de vouw zoals een
 * bezoeker de pagina opent — precies wat er in een laptopbeeld hoort.
 * `fullPageScreenshot` is de hele pagina van boven tot onder; in een venster van
 * 16:10 zie je daar alleen de bovenrand van, dus die is de terugval en niet de
 * eerste keuze.
 *
 * Alles wat geen bruikbare `data:image/`-URI is, telt niet: een lege string, een
 * pad, of een object dat er toevallig staat, levert `null` op in plaats van een
 * `<img>` die stukgaat bij de klant.
 */

/** De vorm van een data-URI: type, base64-markering, en een lading erachter. */
const IS_BEELD = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/i;

/**
 * Hoe een echt beeldbestand begint, in base64.
 *
 * Op de kenmerkende eerste bytes controleren en niet op een minimumlengte. Dat
 * laatste klinkt logisch maar is een gegokt getal: een kleine schermafdruk is
 * geldig en een lange onzinstring niet. De eerste bytes zeggen wél of dit een
 * JPEG of PNG is — en dat is precies wat een browser straks ook gaat lezen.
 */
const BEELD_START = ["/9j/", "iVBOR", "R0lGOD", "UklGR"];
export function kiesSchermafdruk(lh: LighthouseBeeld | null | undefined): string | null {
  if (!lh) return null;

  const kandidaten = [
    lh.audits?.["final-screenshot"]?.details?.data,
    lh.fullPageScreenshot?.screenshot?.data,
  ];

  for (const k of kandidaten) {
    if (typeof k !== "string") continue;
    const m = IS_BEELD.exec(k);
    if (m && BEELD_START.some((start) => m[1].startsWith(start))) return k;
  }
  return null;
}
