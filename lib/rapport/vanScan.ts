import type { ScanRapport } from "@/lib/scan";
import type { AuditResultaten } from "@/lib/audit";
import type { Bevinding as GeoBevinding } from "@/lib/geo-analyse";
import type {
  Bevinding,
  Ernst,
  Onderdeel,
  Prioriteit,
  Rapport,
  SamenvattingKaart,
  Vaststelling,
} from "./types";
import { standVanScore } from "./schaal";

/**
 * Zet een voltooide scan om in het klantrapport.
 *
 * Dit is de enige plek waar de meettaal ("percentage", "llm_results",
 * "bestPractices") wordt vertaald naar klanttaal. De meetlagen mogen dus intern
 * heten wat ze willen, en het rapport blijft leesbaar.
 *
 * Wat níét gemeten is, wordt hier een `null`-score en een regel in
 * `nietBeoordeeld` — nooit een nul. Een dienst die haperde mag niet lezen als
 * een slechte site.
 */

const MODEL_NAAM: Record<keyof AuditResultaten, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

/** De ernstschaal van de meetlagen naar die van het rapport. */
function ernstVan(geo: GeoBevinding): Ernst {
  if (geo.goed) return "info";
  if (geo.ernst === "kritiek") return "ernstig";
  if (geo.ernst === "belangrijk") return "gemiddeld";
  return "licht";
}

/**
 * Een bevinding uit een meetlaag naar rapportvorm.
 *
 * "In orde." verdwijnt als advies: dat is een notitie aan onszelf dat er niets
 * te doen is, geen zin die een klant iets vertelt.
 */
function bevindingVan(geo: GeoBevinding): Bevinding {
  return {
    titel: geo.titel,
    uitleg: geo.uitleg,
    advies: geo.goed || /^in orde\.?$/i.test(geo.advies.trim()) ? undefined : geo.advies,
    ernst: ernstVan(geo),
    goed: geo.goed,
  };
}

function bevindingenVan(uitkomst: unknown): Bevinding[] {
  const b = (uitkomst as { bevindingen?: GeoBevinding[] } | null | undefined)?.bevindingen;
  return Array.isArray(b) ? b.map(bevindingVan) : [];
}

/** De adviezen bij gemiste punten, als actielijst. Dubbele adviezen eruit. */
function actiesVan(bevindingen: Bevinding[], terugval: string): string[] {
  const acties = Array.from(
    new Set(bevindingen.filter((b) => !b.goed && b.advies).map((b) => b.advies!)),
  );
  return acties.length > 0 ? acties : [terugval];
}

// ---------------------------------------------------------------------------
// De vier onderdelen
// ---------------------------------------------------------------------------

function vindbaarheid(scan: ScanRapport): Onderdeel {
  const bevindingen = bevindingenVan(scan.vindbaarheid);
  const gemist = bevindingen.filter((b) => !b.goed).length;
  const score = bevindingen.length === 0 ? null : Math.round(((bevindingen.length - gemist) / bevindingen.length) * 100);

  return {
    sleutel: "vindbaarheid",
    nummer: 1,
    naam: "Vindbaarheid",
    oordeelKop:
      gemist === 0
        ? "Google kan uw site vinden en volledig lezen"
        : "Google kan uw site vinden, maar loopt onderweg tegen iets aan",
    methode:
      "We halen uw robots.txt en sitemap op, en controleren per pagina de kop van het document: mag de pagina geïndexeerd worden, staat de canonical erin, en is de taal vastgelegd. Dat is precies de route die een zoekmachine ook aflegt.",
    score,
    norm: 80,
    prioriteit: gemist === 0 ? 1 : 3,
    oordeel:
      gemist === 0
        ? "Google kan uw site vinden en begrijpen. Hier is geen werk te doen."
        : `${gemist} ${gemist === 1 ? "punt houdt" : "punten houden"} zoekmachines tegen. Dit is instelwerk, geen bouwwerk — meestal een kwestie van uren, niet van dagen.`,
    metingen: [],
    vaststellingen: [],
    bevindingen,
    acties: actiesVan(bevindingen, "Niets. Dit onderdeel staat goed — laat het zoals het is."),
  };
}

function snelheid(scan: ScanRapport): Onderdeel {
  const { score, scores, fout } = scan.techniek;
  const bevindingen: Bevinding[] = [];

  // De losse Lighthouse-cijfers als bevinding, elk met hun eigen norm.
  const cijfers: { label: string; waarde: number | null; uitleg: string }[] = [
    { label: "Prestatie", waarde: scores.prestatie, uitleg: "Hoe snel de pagina bruikbaar is op een gemiddelde mobiele verbinding." },
    { label: "SEO-basis", waarde: scores.seo, uitleg: "De technische punten waar een zoekmachine op let." },
    { label: "Toegankelijkheid", waarde: scores.toegankelijkheid, uitleg: "Een eerste, geautomatiseerde indruk — het volledige onderzoek komt apart." },
    { label: "Best practices", waarde: scores.bestPractices, uitleg: "Algemene bouwkwaliteit: veilige verbindingen, geen verouderde technieken." },
  ];
  for (const c of cijfers) {
    if (c.waarde === null) continue;
    bevindingen.push({
      titel: `${c.label}: ${c.waarde}/100`,
      uitleg: c.uitleg,
      advies: c.waarde >= 80 ? undefined : `Dit cijfer haalt de norm van 80 nog niet.`,
      ernst: c.waarde >= 80 ? "info" : c.waarde >= 50 ? "gemiddeld" : "ernstig",
      goed: c.waarde >= 80,
    });
  }

  const stand = standVanScore(score, 80);

  return {
    sleutel: "snelheid",
    nummer: 2,
    naam: "Snelheid",
    oordeelKop:
      score === null
        ? "De snelheid kon deze keer niet gemeten worden"
        : stand === "goed"
          ? "Uw pagina is snel genoeg om niemand kwijt te raken"
          : "De pagina laadt, maar het eerste beeld laat op zich wachten",
    methode:
      "We meten met Lighthouse hoe uw pagina zich gedraagt op een gemiddelde mobiele verbinding — dus niet op uw eigen glasvezel, maar zoals een bezoeker het onderweg ervaart.",
    score,
    norm: 80,
    prioriteit: stand === "goed" ? 2 : 4,
    oordeel:
      score === null
        ? (fout ?? "De snelheidsmeting leverde geen uitkomst op. Dit onderdeel telt daarom niet mee in het totaal.")
        : stand === "goed"
          ? "De pagina komt snel genoeg binnen. Hier valt weinig te winnen; kijk liever naar de andere onderdelen."
          : "Uw pagina komt aan, maar de eerste seconden ziet een bezoeker weinig. Dat is precies het moment waarop mensen teruggaan naar de zoekresultaten.",
    metingen:
      scores.lcp === null
        ? []
        : [
            {
              titel: "Eerste teken van leven",
              uitleg: "Hoe lang het duurt voordat het grootste element op uw scherm verschijnt.",
              waarde: scores.lcp,
              weergave: `${scores.lcp.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s`,
              schaal: {
                zones: [
                  { tot: 2.5, stand: "goed", label: "snel" },
                  { tot: 4.0, stand: "beter", label: "kan beter" },
                  { tot: 8.0, stand: "nodig", label: "traag" },
                ],
              },
              duiding:
                scores.lcp <= 2.5
                  ? `${scores.lcp.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s — binnen de norm van Google. Een bezoeker ziet vrijwel meteen iets staan.`
                  : `${scores.lcp.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s voordat het hoofdbeeld er staat. Dat voelt als wachten, ook al is de pagina onderweg.`,
            },
          ],
    vaststellingen: [],
    bevindingen,
    acties: actiesVan(bevindingen, "Niets. De snelheid haalt de norm — laat het zoals het is."),
  };
}

function veiligheid(scan: ScanRapport): Onderdeel {
  const gegevens = scan.beveiliging as { percentage?: number; cijfer?: string } | null | undefined;
  const score = typeof gegevens?.percentage === "number" ? gegevens.percentage : null;
  const bevindingen = bevindingenVan(scan.beveiliging);
  const stand = standVanScore(score, 70);

  return {
    sleutel: "veiligheid",
    nummer: 3,
    naam: "Veiligheid",
    oordeelKop:
      stand === "goed"
        ? "De beveiligingsinstellingen staan goed"
        : "De basis staat, een paar instellingen ontbreken nog",
    methode:
      "We vragen uw pagina op zoals een browser dat doet en kijken welke beveiligingsinstellingen uw server meestuurt. Dit is instelwerk op de server of bij de hosting — er hoeft niets aan uw site zelf te veranderen.",
    score,
    norm: 70,
    prioriteit: stand === "goed" ? 1 : 2,
    oordeel:
      stand === "goed"
        ? "Uw server stuurt de instellingen mee die ertoe doen. Hier is geen werk te doen."
        : `Kleine beveiligingsverbeteringen verkleinen risico's zonder grote ingrepen${gegevens?.cijfer ? ` — nu cijfer ${gegevens.cijfer}` : ""}. Geen spoed, wel relevant voor de komende jaren.`,
    metingen: [],
    vaststellingen: [],
    bevindingen,
    acties: actiesVan(bevindingen, "Niets. De instellingen staan goed."),
  };
}

function aiVindbaarheid(scan: ScanRapport): Onderdeel {
  const { score, gevonden, getest, resultaten, fout } = scan.zichtbaarheid;

  const vaststellingen: Vaststelling[] = [];
  if (resultaten) {
    for (const sleutel of Object.keys(resultaten) as (keyof AuditResultaten)[]) {
      const model = resultaten[sleutel];
      if (!model.success) continue;
      vaststellingen.push({
        titel: MODEL_NAAM[sleutel],
        uitleg: model.target_found
          ? "Dit model noemt uw bedrijf als het gevraagd wordt wie het aanraadt in uw vakgebied."
          : `Gevraagd wie het aanraadt in uw vakgebied, noemt dit model${
              model.competitors.length > 0
                ? ` wel ${model.competitors.slice(0, 3).map((c) => c.name).filter(Boolean).join(", ")}`
                : " andere partijen"
            }.`,
        antwoord: model.target_found ? "Noemt uw bedrijf" : "Noemt uw bedrijf niet",
        stand: model.target_found ? "goed" : "nodig",
      });
    }
  }

  // De llms.txt- en crawlerbevindingen uit de GEO-analyse horen hier thuis:
  // dat is precies wat bepaalt of een model uw site überhaupt kan lezen.
  const bevindingen = scan.geo.bevindingen
    .filter((b) => /crawler|llms\.txt|json-?ld|structured|kop/i.test(`${b.titel} ${b.uitleg}`))
    .map(bevindingVan);

  return {
    sleutel: "ai-vindbaarheid",
    nummer: 4,
    naam: "AI-vindbaarheid",
    oordeelKop:
      getest === 0
        ? "Dit onderdeel kon niet gemeten worden"
        : gevonden === 0
          ? "AI-assistenten noemen u nog niet"
          : gevonden === getest
            ? "Alle bevraagde modellen noemen uw bedrijf"
            : "Een deel van de modellen noemt uw bedrijf",
    methode:
      "We stellen vier taalmodellen — ChatGPT, Claude, Gemini en Perplexity — dezelfde vraag: wie raad je aan in dit vakgebied? Daarna kijken we of uw domein in het antwoord voorkomt. Daarnaast controleren we of uw site door hun crawlers gelezen mag worden.",
    score,
    norm: 50,
    prioriteit: gevonden === 0 ? 5 : gevonden < getest ? 4 : 2,
    oordeel:
      getest === 0
        ? (fout ?? "Er was geen model bereikbaar, of er kon geen vakgebied worden afgeleid. Dit onderdeel telt daarom niet mee in het totaal.")
        : gevonden === 0
          ? "Steeds meer mensen laten ChatGPT of Gemini uitzoeken waar ze iets kopen. In onze meting kwam u in geen van de antwoorden voor — ook niet als u scherper geprijsd bent dan de partijen die wél genoemd worden. Dit is inrichtingswerk dat u één keer doet."
          : `${gevonden} van de ${getest} bevraagde modellen ${gevonden === 1 ? "noemt" : "noemen"} uw bedrijf. Dat is winst die u vasthoudt zolang uw site leesbaar blijft voor hun crawlers.`,
    metingen: [],
    vaststellingen,
    bevindingen,
    acties: actiesVan(
      bevindingen,
      gevonden === getest && getest > 0
        ? "Niets. Blijf de site leesbaar houden voor de crawlers van de modellen."
        : "Publiceer een llms.txt en zorg dat uw aanbod als structured data in de pagina staat, zodat een assistent uw producten kan uitlezen.",
    ),
  };
}

// ---------------------------------------------------------------------------
// Samenvatting
// ---------------------------------------------------------------------------

/** Per onderdeel één kaart, zwaarste eerst — de doorbladerbare samenvatting. */
function samenvattingVan(onderdelen: Onderdeel[]): SamenvattingKaart[] {
  const vragen: Record<string, string> = {
    vindbaarheid: "Kan Google uw site vinden en lezen?",
    snelheid: "Hoe snel is uw website?",
    veiligheid: "Hoe goed is de technische basis?",
    "ai-vindbaarheid": "Is uw site klaar voor AI-assistenten?",
  };

  return [...onderdelen]
    .sort((a, b) => b.prioriteit - a.prioriteit)
    .map((o) => ({
      vraag: vragen[o.sleutel] ?? o.naam,
      kop: o.oordeelKop,
      verhaal: o.oordeel,
      waaromBelangrijk:
        o.score === null
          ? "Dit onderdeel telt niet mee in het totaal, maar hoort wel bij het gesprek."
          : `Dit onderdeel staat op ${o.score} van 100; de norm is ${o.norm}.`,
      slotzin:
        o.prioriteit >= 4
          ? "Dit zouden wij als eerste bespreken."
          : o.prioriteit >= 3
            ? "Klein om te verhelpen, en de moeite waard."
            : "Geen spoed — dit staat er goed voor.",
      prioriteit: o.prioriteit,
    }));
}

// ---------------------------------------------------------------------------
// Het rapport
// ---------------------------------------------------------------------------

export function rapportVanScan(
  scan: ScanRapport,
  opts: { bedrijf?: string | null; gemetenOp?: string; rekentijdSeconden?: number } = {},
): Rapport {
  const onderdelen = [vindbaarheid(scan), snelheid(scan), veiligheid(scan), aiVindbaarheid(scan)];

  // Regel 4: wat we niet konden beoordelen, staat erbij — inclusief de reden.
  const nietBeoordeeld: string[] = [
    "Of uw winkelsoftware op de nieuwste versie draait; dat staat niet in de pagina zelf.",
    "Of het bestelproces tot en met de betaling werkt — we plaatsen geen proefbestelling.",
  ];
  for (const o of onderdelen) {
    if (o.score === null) nietBeoordeeld.unshift(`${o.naam}: ${o.oordeel}`);
  }
  for (const w of scan.waarschuwingen) nietBeoordeeld.push(w);

  const controles = onderdelen.reduce(
    (n, o) => n + o.bevindingen.length + o.vaststellingen.length + o.metingen.length,
    0,
  );

  return {
    bedrijf: opts.bedrijf ?? null,
    host: scan.host,
    url: scan.url,
    totaalScore: scan.totaalScore,
    schermafdruk: scan.voorbeeld ?? null,
    onderdelen,
    samenvatting: samenvattingVan(onderdelen),
    herkomst: {
      paginas: 1,
      controles,
      rekentijdSeconden: opts.rekentijdSeconden ?? 0,
      gemetenOp: opts.gemetenOp ?? new Date().toISOString(),
      instrumenten: [
        { naam: "Lighthouse", versie: "via PageSpeed Insights" },
        { naam: "modellen", versie: `${scan.zichtbaarheid.getest} bevraagd` },
      ],
      scoremodel: "1.0.0",
    },
    nietBeoordeeld,
  };
}

/** Alleen voor de tests: de losse onderdeelbouwers. */
export const _intern = { vindbaarheid, snelheid, veiligheid, aiVindbaarheid, samenvattingVan };
