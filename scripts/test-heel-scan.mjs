/**
 * Tests voor lib/rapport/heelScan.ts — de normalisatie van een bewaarde scan.
 * Draaien: npm run test:heel-scan
 *
 * Deze tests bestaan naar aanleiding van een echte storing: het klantrapport
 * gaf "Application error: a client-side exception has occurred" zodra je een
 * eerder bewaarde scan opende. Oorzaak was één ontbrekende sleutel in de
 * JSON-kolom — `scores.lcp` las als `undefined`, de controle keek op `=== null`
 * en liet 'm door, en de regel erna riep `.toLocaleString()` aan op niets.
 *
 * Vandaar de opzet hieronder: niet alleen de gelukkige weg, maar per veld een
 * scan waarin dat veld ontbreekt. Alles moet een rapport opleveren.
 */
import { heelScan } from "../lib/rapport/heelScan.ts";
import { rapportVanScan } from "../lib/rapport/vanScan.ts";

let goed = 0;
let fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) {
    goed++;
    console.log(`  ok   ${naam}`);
  } else {
    fout++;
    console.log(
      `  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`,
    );
  }
}

function bouwt(naam, scan) {
  try {
    const r = rapportVanScan(scan, { bedrijf: null, gemetenOp: "2026-08-26T12:00:00.000Z" });
    test(naam, r.onderdelen.length, 7);
  } catch (e) {
    fout++;
    console.log(`  FOUT ${naam} → wierp: ${e.message}`);
  }
}

/** Een volledige, geslaagde scan zoals de scanner 'm vandaag wegschrijft. */
function scan(aanpassing = {}) {
  return {
    url: "https://voorbeeld.nl",
    host: "voorbeeld.nl",
    niche: "webshop",
    paginatitel: "Voorbeeld",
    totaalScore: 62,
    geo: { score: 55, bevindingen: [] },
    techniek: {
      score: 48,
      scores: { prestatie: 48, seo: 82, toegankelijkheid: 71, bestPractices: 90, lcp: 3.4 },
    },
    zichtbaarheid: { score: 25, gevonden: 1, getest: 4, resultaten: null },
    waarschuwingen: [],
    beveiliging: { percentage: 60, bevindingen: [] },
    scripts: { bevindingen: [] },
    vindbaarheid: { bevindingen: [] },
    voorbeeld: null,
    audits: {},
    paginas: [],
    technologie: [],
    rekentijdMs: 1200,
    ...aanpassing,
  };
}

console.log("\nheelScan — normalisatie");

test("een ontbrekende lcp wordt null, geen undefined", heelScan(
  scan({ techniek: { score: 48, scores: { prestatie: 48, seo: 82 } } }),
).techniek.scores.lcp, null);

test(
  "een echte lcp blijft ongemoeid",
  heelScan(scan()).techniek.scores.lcp,
  3.4,
);

test(
  "een ontbrekende techniek levert een lege scorereeks op",
  heelScan(scan({ techniek: undefined })).techniek.scores.prestatie,
  null,
);

test(
  "waarschuwingen zijn altijd een lijst, ook als ze ontbreken",
  heelScan(scan({ waarschuwingen: undefined })).waarschuwingen,
  [],
);

test(
  "een host die ontbreekt valt terug op de url",
  heelScan({ url: "https://x.nl" }).host,
  "https://x.nl",
);

test(
  "een totaalScore die ontbreekt wordt null — nooit nul",
  heelScan(scan({ totaalScore: undefined })).totaalScore,
  null,
);

// Een nul is een échte uitslag en moet blijven staan; alleen een ontbrekende
// meting wordt null. Zonder dit onderscheid leest een storing als een slechte
// site.
test("een score van 0 blijft 0", heelScan(scan({ totaalScore: 0 })).totaalScore, 0);

test(
  "technologie zonder namen-lijst valt eruit",
  heelScan(scan({ technologie: [{ groep: "Hosting" }, { groep: "Meten", namen: ["GA4"] }] }))
    .technologie.length,
  1,
);

console.log("\nheelScan — modeluitkomsten");

test(
  "een uitkomst zonder concurrentenlijst krijgt een lege lijst",
  heelScan(
    scan({
      zichtbaarheid: {
        score: 0,
        gevonden: 0,
        getest: 4,
        resultaten: { openai: { success: true, target_found: false } },
      },
    }),
  ).zichtbaarheid.resultaten.openai.competitors,
  [],
);

test(
  "een model dat helemaal ontbreekt wordt 'geen antwoord', geen gat",
  heelScan(
    scan({
      zichtbaarheid: {
        score: 0,
        gevonden: 0,
        getest: 4,
        resultaten: { openai: { success: true, target_found: true, competitors: [] } },
      },
    }),
  ).zichtbaarheid.resultaten.gemini.success,
  false,
);

test(
  "geen resultaten blijft null — dat is iets anders dan vier stille modellen",
  heelScan(scan()).zichtbaarheid.resultaten,
  null,
);

console.log("\nrapportVanScan — bouwt uit elke bewaarde vorm");

bouwt("volledige scan", scan());
bouwt("zonder geo", scan({ geo: undefined }));
bouwt("zonder techniek", scan({ techniek: undefined }));
bouwt("zonder scores in techniek", scan({ techniek: { score: null } }));
bouwt("zonder lcp", scan({ techniek: { score: 40, scores: { prestatie: 40 } } }));
bouwt("zonder zichtbaarheid", scan({ zichtbaarheid: undefined }));
bouwt("zonder waarschuwingen", scan({ waarschuwingen: undefined }));
bouwt("zonder beveiliging, scripts en vindbaarheid", scan({
  beveiliging: undefined,
  scripts: undefined,
  vindbaarheid: undefined,
}));
bouwt("zonder audits", scan({ audits: undefined }));
bouwt("zonder paginas", scan({ paginas: undefined }));
bouwt("zonder technologie", scan({ technologie: undefined }));
bouwt("met een leeg object — de uiterste vorm", {});

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
