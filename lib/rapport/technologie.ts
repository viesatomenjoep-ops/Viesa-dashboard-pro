import type { TechGroep } from "./types";

/**
 * Herkent de technologie achter een site uit de HTML en de response-headers.
 *
 * Geen dienst, geen sleutel, geen kosten: alles wat we nodig hebben staat in
 * de pagina die we toch al ophalen. Wat we bewust níét doen is een versienummer
 * gokken — dat staat vrijwel altijd alleen in code die pas in de browser draait,
 * en daar kijken we niet in. Zeggen dat een winkel "achterloopt" op grond van
 * een gok is precies het soort bewering waar een rapport zijn geloofwaardigheid
 * mee verspeelt.
 */

type Patroon = {
  naam: string;
  groep: string;
  /** Waar we naar zoeken in de HTML. */
  html?: RegExp;
  /** Of in een response-header (naam in kleine letters). */
  header?: { naam: string; waarde?: RegExp };
};

const PATRONEN: Patroon[] = [
  // Winkelsoftware — het belangrijkste voor ons gesprek.
  { naam: "Shopify", groep: "Winkelsoftware", html: /cdn\.shopify\.com|shopify-features/i },
  { naam: "WooCommerce", groep: "Winkelsoftware", html: /woocommerce|wc-ajax/i },
  { naam: "Magento", groep: "Winkelsoftware", html: /mage\/|magento|static\/version/i },
  { naam: "Lightspeed", groep: "Winkelsoftware", html: /lightspeedhq|shoplightspeed/i },
  { naam: "CCV Shop", groep: "Winkelsoftware", html: /ccvshop/i },
  { naam: "PrestaShop", groep: "Winkelsoftware", html: /prestashop/i },
  { naam: "Shopware", groep: "Winkelsoftware", html: /shopware/i },

  // Contentbeheer
  { naam: "WordPress", groep: "Contentbeheer", html: /wp-content|wp-includes|wp-json/i },
  { naam: "Drupal", groep: "Contentbeheer", html: /drupal-settings-json|sites\/default\/files/i },
  { naam: "Joomla", groep: "Contentbeheer", html: /joomla|\/media\/system\/js\//i },
  { naam: "TYPO3", groep: "Contentbeheer", html: /typo3temp|typo3conf/i },
  { naam: "Wix", groep: "Contentbeheer", html: /wix\.com|wixstatic/i },
  { naam: "Squarespace", groep: "Contentbeheer", html: /squarespace/i },
  { naam: "Webflow", groep: "Contentbeheer", html: /webflow/i },

  // Bouwtechniek
  { naam: "React", groep: "Bouwtechniek", html: /__REACT_DEVTOOLS|data-reactroot|react\.production/i },
  { naam: "Next.js", groep: "Bouwtechniek", html: /__NEXT_DATA__|\/_next\//i, header: { naam: "x-powered-by", waarde: /next\.js/i } },
  { naam: "Vue", groep: "Bouwtechniek", html: /data-v-[0-9a-f]{8}|vue\.runtime/i },
  { naam: "Nuxt", groep: "Bouwtechniek", html: /__NUXT__|\/_nuxt\//i },
  { naam: "Angular", groep: "Bouwtechniek", html: /ng-version=|angular\.min\.js/i },
  { naam: "jQuery", groep: "Bouwtechniek", html: /jquery[.-]/i },
  { naam: "Bootstrap", groep: "Bouwtechniek", html: /bootstrap(\.min)?\.(css|js)/i },
  { naam: "Tailwind CSS", groep: "Bouwtechniek", html: /tailwind/i },

  // Hosting en levering
  { naam: "Cloudflare", groep: "Hosting", header: { naam: "server", waarde: /cloudflare/i } },
  { naam: "Vercel", groep: "Hosting", header: { naam: "server", waarde: /vercel/i } },
  { naam: "Nginx", groep: "Hosting", header: { naam: "server", waarde: /nginx/i } },
  { naam: "Apache", groep: "Hosting", header: { naam: "server", waarde: /apache/i } },
  { naam: "Microsoft IIS", groep: "Hosting", header: { naam: "server", waarde: /iis|microsoft/i } },
  { naam: "LiteSpeed", groep: "Hosting", header: { naam: "server", waarde: /litespeed/i } },

  // Meten — het onderdeel waar het gesprek over gaat.
  { naam: "Google Analytics", groep: "Meten", html: /google-analytics\.com|gtag\/js|googletagmanager\.com\/gtag/i },
  { naam: "Google Tag Manager", groep: "Meten", html: /googletagmanager\.com\/gtm/i },
  { naam: "Meta Pixel", groep: "Meten", html: /connect\.facebook\.net|fbevents\.js/i },
  { naam: "Hotjar", groep: "Meten", html: /hotjar/i },
  { naam: "Matomo", groep: "Meten", html: /matomo|piwik/i },
  { naam: "Plausible", groep: "Meten", html: /plausible\.io/i },

  // Beveiliging — leesbaar gemaakt uit de headers.
  { naam: "HSTS", groep: "Beveiliging", header: { naam: "strict-transport-security" } },
  { naam: "Content-Security-Policy", groep: "Beveiliging", header: { naam: "content-security-policy" } },
];

/** De volgorde waarin de groepen in het rapport verschijnen. */
const GROEPVOLGORDE = [
  "Winkelsoftware",
  "Contentbeheer",
  "Bouwtechniek",
  "Hosting",
  "Meten",
  "Beveiliging",
];

export function herkenTechnologie(
  html: string,
  headers: Record<string, string>,
): TechGroep[] {
  const klein: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) klein[k.toLowerCase()] = v;

  const perGroep = new Map<string, string[]>();

  for (const p of PATRONEN) {
    let gevonden = false;

    if (p.html && p.html.test(html)) gevonden = true;

    if (!gevonden && p.header) {
      const waarde = klein[p.header.naam];
      if (waarde !== undefined) {
        gevonden = p.header.waarde ? p.header.waarde.test(waarde) : true;
      }
    }

    if (!gevonden) continue;
    const lijst = perGroep.get(p.groep) ?? [];
    if (!lijst.includes(p.naam)) lijst.push(p.naam);
    perGroep.set(p.groep, lijst);
  }

  return GROEPVOLGORDE.filter((g) => perGroep.has(g)).map((g) => ({
    groep: g,
    namen: perGroep.get(g)!,
  }));
}

/** Draait er iets dat bezoekersgedrag meet? */
export function heeftMeting(groepen: TechGroep[]): boolean {
  return groepen.some((g) => g.groep === "Meten" && g.namen.length > 0);
}

/** Het totaal aantal herkende technologieën. */
export function aantalTechnologieen(groepen: TechGroep[]): number {
  return groepen.reduce((n, g) => n + g.namen.length, 0);
}
