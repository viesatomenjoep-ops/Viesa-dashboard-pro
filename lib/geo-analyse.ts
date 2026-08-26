/**
 * GEO-analyse: hoe leesbaar is een website voor taalmodellen?
 *
 * Alles hier werkt op de opgehaalde HTML en robots.txt — geen externe dienst,
 * geen kosten. Dat is bewust: de signalen die er voor taalmodellen toe doen
 * staan gewoon in de pagina zelf.
 *
 * De volgorde van de bevindingen is die van hun gewicht. Bovenaan staat het
 * enige signaal dat alles anders overbodig maakt: blokkeert de site de
 * AI-crawlers, dan kán geen enkel model het bedrijf noemen, hoe goed de inhoud
 * ook is. Dat is meestal een vergeten regel in robots.txt en in vijf minuten op
 * te lossen — het sterkste verkoopargument dat er is.
 *
 * Deze module is puur: HTML in, score uit. Dus testbaar zonder netwerk
 * (scripts/test-geo.mjs).
 */

export type Bevinding = {
  /** Korte titel, in het Nederlands. */
  titel: string;
  /** Wat we zagen. */
  uitleg: string;
  /** Wat de klant eraan doet. */
  advies: string;
  /** Hoeveel punten dit kost of oplevert. */
  gewicht: number;
  /** Gehaald of niet. */
  goed: boolean;
  /** Een gemist punt van dit niveau weegt zwaarder in het gesprek. */
  ernst: "kritiek" | "belangrijk" | "klein";
};

export type GeoAnalyse = {
  score: number;
  bevindingen: Bevinding[];
  /** Afgeleid uit de pagina — vult het niche-veld voor de zichtbaarheidscheck. */
  voorgesteldeNiche: string | null;
  /** Titel van de pagina, voor in het rapport. */
  paginatitel: string | null;
  /** Waarschuwing als de pagina vrijwel geen tekst bevat. */
  vermoedelijkJsSite: boolean;
};

/** Crawlers die de grote modellen voeden. Blokkeren = onzichtbaar zijn. */
export const AI_CRAWLERS = [
  { naam: "GPTBot", model: "ChatGPT" },
  { naam: "OAI-SearchBot", model: "ChatGPT-zoeken" },
  { naam: "ClaudeBot", model: "Claude" },
  { naam: "anthropic-ai", model: "Claude" },
  { naam: "PerplexityBot", model: "Perplexity" },
  { naam: "Google-Extended", model: "Gemini" },
  { naam: "CCBot", model: "Common Crawl (voedt veel modellen)" },
] as const;

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

/**
 * Welke AI-crawlers worden geweerd?
 *
 * Leest robots.txt zoals een crawler dat doet: per user-agent-blok, en een
 * `Disallow: /` telt als volledige blokkade. Een `User-agent: *` met
 * `Disallow: /` blokkeert iedereen, inclusief de AI-crawlers.
 */
export function geblokkeerdeCrawlers(robotsTxt: string): string[] {
  if (!robotsTxt.trim()) return [];

  const regels = robotsTxt
    .split("\n")
    .map((r) => r.replace(/#.*$/, "").trim())
    .filter(Boolean);

  // Per user-agent verzamelen welke disallow-regels erbij horen.
  const blokken: { agents: string[]; disallows: string[] }[] = [];
  let huidig: { agents: string[]; disallows: string[] } | null = null;
  let vorigeWasAgent = false;

  for (const regel of regels) {
    const [sleutelRuw, ...rest] = regel.split(":");
    const sleutel = sleutelRuw.trim().toLowerCase();
    const waarde = rest.join(":").trim();

    if (sleutel === "user-agent") {
      // Opeenvolgende user-agent-regels horen bij hetzelfde blok.
      if (!huidig || !vorigeWasAgent) {
        huidig = { agents: [], disallows: [] };
        blokken.push(huidig);
      }
      huidig.agents.push(waarde.toLowerCase());
      vorigeWasAgent = true;
    } else if (sleutel === "disallow" && huidig) {
      huidig.disallows.push(waarde);
      vorigeWasAgent = false;
    } else {
      vorigeWasAgent = false;
    }
  }

  const volledigGeblokkeerd = (agent: string): boolean => {
    const naam = agent.toLowerCase();
    const passend = blokken.filter(
      (b) => b.agents.includes(naam) || b.agents.includes("*"),
    );
    // Een blok dat de crawler bij naam noemt wint van het sterretje.
    const specifiek = passend.filter((b) => b.agents.includes(naam));
    const relevant = specifiek.length > 0 ? specifiek : passend;
    return relevant.some((b) => b.disallows.some((d) => d === "/"));
  };

  return AI_CRAWLERS.filter((c) => volledigGeblokkeerd(c.naam)).map((c) => c.naam);
}

// ---------------------------------------------------------------------------
// HTML-signalen
// ---------------------------------------------------------------------------

function tekstUit(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function eersteMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1]?.trim() || null;
}

/** Alle JSON-LD-blokken, met de @type-waarden die erin staan. */
export function jsonLdTypes(html: string): string[] {
  const types: string[] = [];
  // Array.from omdat het tsconfig-doel van dit project geen iterators toestaat.
  const blokken = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  );
  for (const b of blokken) {
    try {
      const data = JSON.parse(b[1].trim());
      const verzamel = (n: unknown) => {
        if (Array.isArray(n)) return n.forEach(verzamel);
        if (n && typeof n === "object") {
          const t = (n as Record<string, unknown>)["@type"];
          if (typeof t === "string") types.push(t);
          else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.push(x));
          const graph = (n as Record<string, unknown>)["@graph"];
          if (graph) verzamel(graph);
        }
      };
      verzamel(data);
    } catch {
      // Ongeldige JSON-LD telt niet mee — een model kan er ook niets mee.
    }
  }
  return Array.from(new Set(types));
}

/**
 * Leidt een niche af uit de pagina zelf, om het zoekwoordveld voor te vullen.
 * Geen AI nodig: de titel en de omschrijving zeggen het meestal al.
 */
function niche(titel: string | null, omschrijving: string | null, h1: string | null): string | null {
  const bron = (omschrijving || titel || h1 || "").trim();
  if (!bron) return null;
  // Alles na een streepje of pijp is meestal de bedrijfsnaam, niet de niche.
  const kern = bron.split(/[|–—]/)[0].trim();
  return kern.length > 3 ? kern.slice(0, 80) : null;
}

// ---------------------------------------------------------------------------
// De analyse
// ---------------------------------------------------------------------------

export function analyseerGeo(opts: {
  html: string;
  robotsTxt: string;
  llmsTxtGevonden: boolean;
}): GeoAnalyse {
  const { html, robotsTxt, llmsTxtGevonden } = opts;
  const bevindingen: Bevinding[] = [];

  const titel = eersteMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const omschrijving = eersteMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  );
  const h1 = eersteMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Aantal = (html.match(/<h1[\s>]/gi) ?? []).length;
  const h2Aantal = (html.match(/<h2[\s>]/gi) ?? []).length;
  const tekst = tekstUit(html);
  const woorden = tekst ? tekst.split(/\s+/).length : 0;
  const types = jsonLdTypes(html);
  const geblokkeerd = geblokkeerdeCrawlers(robotsTxt);

  const voeg = (b: Bevinding) => bevindingen.push(b);

  // 1. AI-crawlers — het enige signaal dat de rest overbodig maakt.
  if (geblokkeerd.length > 0) {
    const modellen = AI_CRAWLERS.filter((c) => geblokkeerd.includes(c.naam))
      .map((c) => c.model)
      .filter((m, i, a) => a.indexOf(m) === i);
    voeg({
      titel: "AI-crawlers worden geblokkeerd",
      uitleg: `robots.txt weert ${geblokkeerd.join(", ")}. Daardoor kan ${modellen.join(" en ")} deze site niet lezen, ongeacht de inhoud.`,
      advies: "Haal deze regels uit robots.txt. Vijf minuten werk, en zonder dit heeft al het andere geen zin.",
      gewicht: 30,
      goed: false,
      ernst: "kritiek",
    });
  } else {
    voeg({
      titel: "AI-crawlers hebben toegang",
      uitleg: robotsTxt.trim()
        ? "robots.txt blokkeert geen van de bekende AI-crawlers."
        : "Er is geen robots.txt, dus niets wordt geweerd.",
      advies: "Zo houden.",
      gewicht: 30,
      goed: true,
      ernst: "kritiek",
    });
  }

  // 2. Gestructureerde data — waar modellen feiten uit halen.
  const nuttigeTypes = types.filter((t) =>
    /organization|localbusiness|product|service|faq|article|breadcrumb|person|website/i.test(t),
  );
  voeg({
    titel: "Gestructureerde data (Schema.org)",
    uitleg:
      nuttigeTypes.length > 0
        ? `Gevonden: ${nuttigeTypes.join(", ")}.`
        : "Geen bruikbare JSON-LD gevonden. Modellen moeten de feiten dan uit lopende tekst raden.",
    advies:
      nuttigeTypes.length > 0
        ? "Aanvullen met FAQPage en Service levert vaak nog winst op."
        : "Voeg JSON-LD toe met Organization en, waar van toepassing, Service en FAQPage.",
    gewicht: 20,
    goed: nuttigeTypes.length > 0,
    ernst: "belangrijk",
  });

  // 3. Antwoordvorm — modellen citeren wat op een antwoord lijkt.
  const heeftFaq = /faqpage/i.test(types.join(" ")) || /<summary[\s>]/i.test(html);
  const lijsten = (html.match(/<(ul|ol)[\s>]/gi) ?? []).length;
  const antwoordvorm = heeftFaq || (h2Aantal >= 3 && lijsten >= 2);
  voeg({
    titel: "Antwoordvorm van de inhoud",
    uitleg: antwoordvorm
      ? `De pagina is opgedeeld in ${h2Aantal} tussenkoppen en ${lijsten} lijsten${heeftFaq ? ", met een vraag-en-antwoordsectie" : ""}.`
      : `Weinig structuur: ${h2Aantal} tussenkoppen en ${lijsten} lijsten. Modellen citeren zelden uit lopende lappen tekst.`,
    advies: antwoordvorm
      ? "Goed. Een expliciete FAQ met echte klantvragen doet er nog een schep bovenop."
      : "Deel de tekst op in tussenkoppen die een vraag beantwoorden, met lijstjes eronder.",
    gewicht: 12,
    goed: antwoordvorm,
    ernst: "belangrijk",
  });

  // 4. Inhoudsdiepte.
  const genoegTekst = woorden >= 300;
  voeg({
    titel: "Hoeveelheid tekst",
    uitleg: `${woorden} woorden leesbare tekst op deze pagina.`,
    advies: genoegTekst
      ? "Voldoende om iets uit te citeren."
      : "Onder de 300 woorden valt er weinig te citeren. Werk de kernpagina's uit.",
    gewicht: 10,
    goed: genoegTekst,
    ernst: genoegTekst ? "klein" : "belangrijk",
  });

  // 5. Titel en omschrijving.
  const kopGoed = Boolean(titel && titel.length >= 15 && omschrijving && omschrijving.length >= 50);
  voeg({
    titel: "Titel en meta-omschrijving",
    uitleg: kopGoed
      ? "Beide aanwezig en van bruikbare lengte."
      : `Titel: ${titel ? `"${titel.slice(0, 60)}"` : "ontbreekt"}. Omschrijving: ${omschrijving ? `${omschrijving.length} tekens` : "ontbreekt"}.`,
    advies: kopGoed
      ? "In orde."
      : "Zorg voor een titel van 15–60 tekens en een omschrijving van 50–160 tekens die zegt wát je doet en voor wie.",
    gewicht: 8,
    goed: kopGoed,
    ernst: "klein",
  });

  // 6. Kopstructuur.
  const kopstructuur = h1Aantal === 1 && h2Aantal >= 2;
  voeg({
    titel: "Kopstructuur",
    uitleg: `${h1Aantal} H1 en ${h2Aantal} H2 op de pagina.`,
    advies: kopstructuur
      ? "In orde."
      : h1Aantal !== 1
        ? "Gebruik precies één H1 per pagina, met daaronder H2's."
        : "Voeg tussenkoppen (H2) toe zodat de opbouw duidelijk is.",
    gewicht: 8,
    goed: kopstructuur,
    ernst: "klein",
  });

  // 7. llms.txt — nog zeldzaam, dus onderscheidend.
  voeg({
    titel: "llms.txt",
    uitleg: llmsTxtGevonden
      ? "Aanwezig — de site vertelt modellen zelf wat ze moeten weten."
      : "Niet aanwezig. Nog weinig sites hebben dit, dus het onderscheidt.",
    advies: llmsTxtGevonden
      ? "Houd hem actueel."
      : "Plaats een /llms.txt met wie je bent, wat je doet en waar de belangrijkste pagina's staan.",
    gewicht: 7,
    goed: llmsTxtGevonden,
    ernst: "klein",
  });

  // 8. Auteur- en actualiteitssignalen.
  const heeftDatum =
    /datepublished|datemodified/i.test(html) ||
    /<time[^>]+datetime=/i.test(html);
  voeg({
    titel: "Datum- en auteurssignalen",
    uitleg: heeftDatum
      ? "De pagina bevat datumgegevens."
      : "Geen publicatie- of wijzigingsdatum gevonden.",
    advies: heeftDatum
      ? "In orde."
      : "Zet datePublished en dateModified in de JSON-LD; modellen wegen actualiteit mee.",
    gewicht: 5,
    goed: heeftDatum,
    ernst: "klein",
  });

  const behaald = bevindingen.filter((b) => b.goed).reduce((s, b) => s + b.gewicht, 0);
  const totaal = bevindingen.reduce((s, b) => s + b.gewicht, 0);
  const score = totaal > 0 ? Math.round((behaald / totaal) * 100) : 0;

  // Een pagina met nauwelijks tekst maar veel scripts is vrijwel zeker
  // client-side gerenderd. Belangrijk om te melden: dan is dit precies wat een
  // crawler óók ziet, en is de lage score dus een echte bevinding.
  const scripts = (html.match(/<script[\s>]/gi) ?? []).length;
  const vermoedelijkJsSite = woorden < 120 && scripts >= 3;

  return {
    score,
    bevindingen: bevindingen.sort((a, b) => {
      if (a.goed !== b.goed) return a.goed ? 1 : -1;
      return b.gewicht - a.gewicht;
    }),
    voorgesteldeNiche: niche(titel, omschrijving, h1),
    paginatitel: titel,
    vermoedelijkJsSite,
  };
}
