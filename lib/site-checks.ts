/**
 * Losse websitecontroles die per stuk een resultaat opleveren.
 *
 * Elke controle geeft een korte uitkomst terug ("288 woorden", "Cijfer D") plus
 * bevindingen. Zo kan de scanner ze één voor één tonen terwijl ze binnenkomen,
 * in plaats van twee minuten een spinner laten draaien.
 *
 * Alles hier is pure logica op al opgehaalde gegevens — geen netwerk, dus
 * testbaar (scripts/test-checks.mjs).
 */

import type { Bevinding } from "@/lib/geo-analyse";

export type CheckUitkomst = {
  /** Korte samenvatting rechts in de lijst, zoals "288 woorden geanalyseerd". */
  samenvatting: string;
  bevindingen: Bevinding[];
};

// ---------------------------------------------------------------------------
// Beveiliging — uit de response-headers
// ---------------------------------------------------------------------------

/** Beveiligingsheaders die er werkelijk toe doen, met hun gewicht. */
const HEADERS = [
  {
    naam: "strict-transport-security",
    label: "HSTS",
    punten: 25,
    advies: "Zet Strict-Transport-Security aan zodat de browser altijd https gebruikt.",
  },
  {
    naam: "content-security-policy",
    label: "Content-Security-Policy",
    punten: 25,
    advies: "Stel een Content-Security-Policy in; dit is de sterkste bescherming tegen ingesloten scripts.",
  },
  {
    naam: "x-content-type-options",
    label: "X-Content-Type-Options",
    punten: 15,
    advies: "Zet X-Content-Type-Options op nosniff.",
  },
  {
    naam: "x-frame-options",
    label: "X-Frame-Options",
    punten: 15,
    advies: "Zet X-Frame-Options of frame-ancestors, zodat de site niet in een frame van een ander kan staan.",
  },
  {
    naam: "referrer-policy",
    label: "Referrer-Policy",
    punten: 10,
    advies: "Stel een Referrer-Policy in, bijvoorbeeld strict-origin-when-cross-origin.",
  },
  {
    naam: "permissions-policy",
    label: "Permissions-Policy",
    punten: 10,
    advies: "Beperk met Permissions-Policy welke browserfuncties de site mag gebruiken.",
  },
] as const;

/** Schoolcijfer op basis van het percentage behaalde punten. */
export function cijferVoor(percentage: number): string {
  if (percentage >= 95) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 35) return "D";
  if (percentage >= 15) return "E";
  return "F";
}

export function controleerBeveiliging(
  headers: Record<string, string>,
  https: boolean,
): CheckUitkomst & { cijfer: string; percentage: number } {
  const genormaliseerd: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) genormaliseerd[k.toLowerCase()] = v;

  const bevindingen: Bevinding[] = [];
  let behaald = 0;
  const totaal = HEADERS.reduce((s, h) => s + h.punten, 0) + 20; // +20 voor https

  if (https) {
    behaald += 20;
    bevindingen.push({
      titel: "Verbinding via https",
      uitleg: "De site wordt versleuteld uitgeleverd.",
      advies: "In orde.",
      gewicht: 20,
      goed: true,
      ernst: "kritiek",
    });
  } else {
    bevindingen.push({
      titel: "Geen https",
      uitleg: "De site draait op een onversleutelde verbinding.",
      advies: "Zet https aan met een certificaat; browsers markeren de site anders als onveilig.",
      gewicht: 20,
      goed: false,
      ernst: "kritiek",
    });
  }

  for (const h of HEADERS) {
    const aanwezig = Boolean(genormaliseerd[h.naam]?.trim());
    if (aanwezig) behaald += h.punten;
    bevindingen.push({
      titel: h.label,
      uitleg: aanwezig ? "Aanwezig." : "Ontbreekt.",
      advies: aanwezig ? "In orde." : h.advies,
      gewicht: h.punten,
      goed: aanwezig,
      ernst: h.punten >= 25 ? "belangrijk" : "klein",
    });
  }

  const percentage = Math.round((behaald / totaal) * 100);
  const cijfer = cijferVoor(percentage);
  const ontbreekt = bevindingen.filter((b) => !b.goed).length;

  return {
    cijfer,
    percentage,
    samenvatting: `Cijfer ${cijfer}${ontbreekt ? ` · ${ontbreekt} header${ontbreekt === 1 ? "" : "s"} ontbreekt` : ""}`,
    bevindingen: bevindingen.sort((a, b) => (a.goed === b.goed ? b.gewicht - a.gewicht : a.goed ? 1 : -1)),
  };
}

// ---------------------------------------------------------------------------
// Scripts & tracking
// ---------------------------------------------------------------------------

/** Bekende trackers, op de domeinnaam waar ze vandaan komen. */
const TRACKERS: { patroon: RegExp; naam: string }[] = [
  { patroon: /googletagmanager\.com/i, naam: "Google Tag Manager" },
  { patroon: /google-analytics\.com|analytics\.google\.com/i, naam: "Google Analytics" },
  { patroon: /connect\.facebook\.net|facebook\.com\/tr/i, naam: "Meta Pixel" },
  { patroon: /hotjar\.com/i, naam: "Hotjar" },
  { patroon: /clarity\.ms/i, naam: "Microsoft Clarity" },
  { patroon: /linkedin\.com\/px|snap\.licdn\.com/i, naam: "LinkedIn Insight" },
  { patroon: /tiktok\.com|tiktokcdn/i, naam: "TikTok Pixel" },
  { patroon: /hubspot|hs-scripts\.com/i, naam: "HubSpot" },
  { patroon: /doubleclick\.net|googleadservices/i, naam: "Google Ads" },
  { patroon: /plausible\.io|umami|simpleanalytics/i, naam: "Privacyvriendelijke statistiek" },
];

export function controleerScripts(html: string, eigenHost: string): CheckUitkomst & {
  aantal: number;
  trackers: string[];
} {
  const srcs = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map((m) => m[1]);
  const inline = (html.match(/<script(?![^>]+src=)[^>]*>/gi) ?? []).length;

  const extern = srcs.filter((s) => {
    if (s.startsWith("/") || s.startsWith("./")) return false;
    try {
      return new URL(s, `https://${eigenHost}`).host !== eigenHost;
    } catch {
      return false;
    }
  });

  const alles = srcs.join(" ") + " " + html;
  const trackers = TRACKERS.filter((t) => t.patroon.test(alles)).map((t) => t.naam);

  const bevindingen: Bevinding[] = [
    {
      titel: "Externe scripts",
      uitleg: `${extern.length} script${extern.length === 1 ? "" : "s"} van andere domeinen, plus ${inline} inline-blok${inline === 1 ? "" : "ken"}.`,
      advies:
        extern.length > 12
          ? "Veel externe scripts vertragen de site en vergroten het aanvalsoppervlak. Loop na wat er echt nodig is."
          : "Aanvaardbaar aantal.",
      gewicht: 10,
      goed: extern.length <= 12,
      ernst: "klein",
    },
    {
      titel: "Trackers",
      uitleg: trackers.length > 0 ? `Gevonden: ${trackers.join(", ")}.` : "Geen bekende trackers gevonden.",
      advies:
        trackers.length > 0
          ? "Controleer of hiervoor toestemming wordt gevraagd vóórdat ze laden — dat is een AVG-vereiste."
          : "Niets te melden.",
      gewicht: 10,
      goed: true,
      ernst: "klein",
    },
  ];

  return {
    aantal: extern.length,
    trackers,
    samenvatting: `${extern.length} extern${extern.length === 1 ? "" : "e"} script${extern.length === 1 ? "" : "s"}${trackers.length ? ` · ${trackers.length} tracker${trackers.length === 1 ? "" : "s"}` : ""}`,
    bevindingen,
  };
}

// ---------------------------------------------------------------------------
// Vindbaarheid
// ---------------------------------------------------------------------------

export function controleerVindbaarheid(opts: {
  html: string;
  robotsTxt: string;
  sitemapGevonden: boolean;
}): CheckUitkomst {
  const { html, robotsTxt, sitemapGevonden } = opts;
  const bevindingen: Bevinding[] = [];

  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  bevindingen.push({
    titel: "Indexering",
    uitleg: noindex
      ? "De pagina staat op noindex — zoekmachines mogen hem niet opnemen."
      : "De pagina mag geïndexeerd worden.",
    advies: noindex
      ? "Haal de noindex weg, tenzij dit bewust een verborgen pagina is."
      : "In orde.",
    gewicht: 25,
    goed: !noindex,
    ernst: noindex ? "kritiek" : "klein",
  });

  const sitemapInRobots = /sitemap:/i.test(robotsTxt);
  bevindingen.push({
    titel: "Sitemap",
    uitleg: sitemapGevonden
      ? `Gevonden${sitemapInRobots ? " en vermeld in robots.txt" : ""}.`
      : "Geen sitemap.xml gevonden.",
    advies: sitemapGevonden
      ? sitemapInRobots
        ? "In orde."
        : "Vermeld de sitemap ook in robots.txt."
      : "Publiceer een sitemap.xml en verwijs ernaar vanuit robots.txt.",
    gewicht: 15,
    goed: sitemapGevonden,
    ernst: "klein",
  });

  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  bevindingen.push({
    titel: "Canonical",
    uitleg: canonical ? "Aanwezig." : "Ontbreekt.",
    advies: canonical
      ? "In orde."
      : "Zet een canonical-link, anders kan dezelfde pagina onder meerdere adressen meetellen.",
    gewicht: 10,
    goed: canonical,
    ernst: "klein",
  });

  const taal = /<html[^>]+lang=["'][a-z]{2}/i.test(html);
  bevindingen.push({
    titel: "Taal vastgelegd",
    uitleg: taal ? "Het lang-attribuut staat op de html-tag." : "Geen lang-attribuut gevonden.",
    advies: taal ? "In orde." : "Zet lang=\"nl\" op de html-tag.",
    gewicht: 5,
    goed: taal,
    ernst: "klein",
  });

  const gemist = bevindingen.filter((b) => !b.goed).length;
  return {
    samenvatting: gemist === 0 ? "Alles in orde" : `${gemist} punt${gemist === 1 ? "" : "en"} te verbeteren`,
    bevindingen,
  };
}

// ---------------------------------------------------------------------------
// Voorbeeldafbeelding
// ---------------------------------------------------------------------------

/**
 * De og:image van de site — een gratis voorvertoning zonder screenshotdienst.
 * Precies de afbeelding die ook verschijnt als iemand de link deelt.
 */
export function voorbeeldAfbeelding(html: string, basisUrl: string): string | null {
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (!m?.[1]) return null;
  try {
    return new URL(m[1], basisUrl).toString();
  } catch {
    return null;
  }
}
