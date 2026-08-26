/**
 * Tests voor lib/rapport/vanScan.ts — de vertaling van scandata naar het
 * klantrapport. Draaien: npm run test:rapport-scan
 *
 * De nadruk ligt op de vier rapportregels die stil fout kunnen gaan: een
 * ontbrekende meting mag geen nul worden, "In orde." mag niet als advies aan
 * een klant verschijnen, en elk onderdeel moet een handeling overhouden.
 */
import { rapportVanScan } from "../lib/rapport/vanScan.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

const geoBevinding = (titel, goedZo, ernst = "klein", advies = "Doe iets.") => ({
  titel, uitleg: "Wat we zagen.", advies, gewicht: 10, goed: goedZo, ernst,
});

/** Een volledige, geslaagde scan. */
function scan(aanpassing = {}) {
  return {
    url: "https://voorbeeld.nl",
    host: "voorbeeld.nl",
    niche: "webshop",
    paginatitel: "Voorbeeld",
    totaalScore: 71,
    geo: {
      score: 68,
      bevindingen: [
        geoBevinding("AI-crawlers toegestaan", true),
        geoBevinding("llms.txt", false, "belangrijk", "Publiceer een llms.txt."),
        geoBevinding("Hoeveelheid tekst", true),
      ],
      voorgesteldeNiche: "webshop",
      paginatitel: "Voorbeeld",
      vermoedelijkJsSite: false,
    },
    techniek: {
      score: 74,
      scores: { prestatie: 66, seo: 92, toegankelijkheid: 78, bestPractices: 85, lcp: 3.2 },
    },
    zichtbaarheid: {
      score: 50,
      gevonden: 2,
      getest: 4,
      resultaten: {
        openai: { success: true, target_found: true, competitors: [] },
        anthropic: { success: true, target_found: true, competitors: [] },
        gemini: { success: true, target_found: false, competitors: [{ name: "Concurrent A", url: "a.nl" }] },
        perplexity: { success: false, target_found: false, competitors: [], error: "Sleutel geweigerd." },
      },
    },
    waarschuwingen: [],
    beveiliging: {
      percentage: 45,
      cijfer: "D",
      bevindingen: [geoBevinding("HSTS", false, "belangrijk", "Zet HSTS aan."), geoBevinding("https", true, "klein", "In orde.")],
    },
    vindbaarheid: {
      bevindingen: [
        geoBevinding("Indexering", true, "klein", "In orde."),
        geoBevinding("Sitemap", false, "klein", "Publiceer een sitemap.xml."),
        geoBevinding("Canonical", true, "klein", "In orde."),
        geoBevinding("Taal vastgelegd", true, "klein", "In orde."),
      ],
    },
    voorbeeld: "https://voorbeeld.nl/og.png",
    ...aanpassing,
  };
}

const r = rapportVanScan(scan(), { bedrijf: "Voorbeeld BV", gemetenOp: "2026-08-26T12:00:00.000Z" });
const perSleutel = Object.fromEntries(r.onderdelen.map((o) => [o.sleutel, o]));

console.log("opbouw");
test("zeven onderdelen", r.onderdelen.map((o) => o.sleutel), ["vindbaarheid", "snelheid", "toegankelijkheid", "werking", "techniek", "veiligheid", "ai-vindbaarheid"]);
test("onderdelen zijn doorlopend genummerd", r.onderdelen.map((o) => o.nummer), [1, 2, 3, 4, 5, 6, 7]);
test("bedrijfsnaam komt op de omslag", r.bedrijf, "Voorbeeld BV");
test("totaalscore wordt overgenomen", r.totaalScore, 71);
test("schermafdruk wordt overgenomen", r.schermafdruk, "https://voorbeeld.nl/og.png");

console.log("\nregel 1 — elk onderdeel heeft een norm");
test("elke norm is een getal boven nul", r.onderdelen.every((o) => typeof o.norm === "number" && o.norm > 0), true);

console.log("\nregel 2 — methode staat er altijd bij");
test("elk onderdeel heeft een methodetekst", r.onderdelen.every((o) => o.methode.length > 40), true);

console.log("\nregel 4 — niet gemeten is een streepje, geen nul");
const zonderSnelheid = rapportVanScan(scan({
  techniek: { score: null, scores: { prestatie: null, seo: null, toegankelijkheid: null, bestPractices: null, lcp: null }, fout: "PageSpeed antwoordde niet." },
}));
const s2 = zonderSnelheid.onderdelen.find((o) => o.sleutel === "snelheid");
test("ontbrekende snelheid geeft score null", s2.score, null);
test("ontbrekende snelheid geeft geen meetbalk", s2.metingen.length, 0);
test("de reden staat in het oordeel", s2.oordeel.includes("PageSpeed antwoordde niet."), true);
test("en komt terug in 'niet beoordeeld'", zonderSnelheid.nietBeoordeeld.some((n) => n.startsWith("Snelheid:")), true);

const zonderModellen = rapportVanScan(scan({
  zichtbaarheid: { score: null, gevonden: 0, getest: 0, resultaten: null, fout: "Geen niche af te leiden." },
}));
const a2 = zonderModellen.onderdelen.find((o) => o.sleutel === "ai-vindbaarheid");
test("geen modellen geeft score null, niet 0", a2.score, null);
test("geen modellen geeft geen vaststellingen", a2.vaststellingen.length, 0);

console.log("\nregel 5 — elk onderdeel eindigt in een handeling");
test("geen enkel onderdeel heeft een lege actielijst", r.onderdelen.every((o) => o.acties.length > 0), true);
test("een onderdeel zonder gemiste punten krijgt een terugvalactie", (() => {
  const alGoed = rapportVanScan(scan({
    vindbaarheid: { bevindingen: [geoBevinding("Indexering", true, "klein", "In orde.")] },
  })).onderdelen.find((o) => o.sleutel === "vindbaarheid");
  return alGoed.acties.length === 1 && alGoed.score === 100;
})(), true);

console.log("\nadvies — 'In orde.' is een notitie aan onszelf, geen klanttekst");
test("geen enkele bevinding toont 'In orde.' als advies", (() => {
  for (const o of r.onderdelen) {
    for (const b of o.bevindingen) {
      if (b.advies && /^in orde\.?$/i.test(b.advies.trim())) return `wel in: ${o.sleutel}/${b.titel}`;
    }
  }
  return true;
})(), true);
test("geen enkele actie is 'In orde.'", r.onderdelen.every((o) => !o.acties.some((a) => /^in orde\.?$/i.test(a.trim()))), true);
test("goede bevindingen dragen nooit een advies", r.onderdelen.every((o) => o.bevindingen.every((b) => !b.goed ? true : b.advies === undefined)), true);

console.log("\nvindbaarheid");
test("score is het aandeel gehaalde punten", perSleutel.vindbaarheid.score, 75);
test("de gemiste sitemap wordt een actie", perSleutel.vindbaarheid.acties.includes("Publiceer een sitemap.xml."), true);

console.log("\nsnelheid — de laadtijd wordt een meetbalk");
test("er is één meetbalk", perSleutel.snelheid.metingen.length, 1);
test("de waarde is de laadtijd", perSleutel.snelheid.metingen[0].waarde, 3.2);
test("weergave in Nederlandse notatie", perSleutel.snelheid.metingen[0].weergave, "3,2 s");
test("de norm van Google (2,5 s) is de eerste zone", perSleutel.snelheid.metingen[0].schaal.zones[0].tot, 2.5);
test("losse Lighthouse-cijfers worden bevindingen", perSleutel.snelheid.bevindingen.length, 4);
test("een cijfer onder de 80 is niet goed", perSleutel.snelheid.bevindingen.find((b) => b.titel.startsWith("Prestatie")).goed, false);
test("een cijfer boven de 80 is wel goed", perSleutel.snelheid.bevindingen.find((b) => b.titel.startsWith("SEO")).goed, true);

console.log("\nveiligheid");
test("percentage wordt de score", perSleutel.veiligheid.score, 45);
test("het cijfer komt terug in het oordeel", perSleutel.veiligheid.oordeel.includes("cijfer D"), true);
test("de norm ligt hier op 70, niet op 80", perSleutel.veiligheid.norm, 70);

console.log("\nAI-vindbaarheid");
test("alleen geslaagde modellen worden vastgesteld", perSleutel["ai-vindbaarheid"].vaststellingen.length, 3);
test("een model dat het bedrijf noemt staat op goed", perSleutel["ai-vindbaarheid"].vaststellingen.find((v) => v.titel === "ChatGPT").stand, "goed");
test("een model dat het bedrijf niet noemt vraagt aandacht", perSleutel["ai-vindbaarheid"].vaststellingen.find((v) => v.titel === "Gemini").stand, "nodig");
test("de genoemde concurrent staat in de uitleg", perSleutel["ai-vindbaarheid"].vaststellingen.find((v) => v.titel === "Gemini").uitleg.includes("Concurrent A"), true);
test("het uitgevallen model komt niet als vaststelling terug", perSleutel["ai-vindbaarheid"].vaststellingen.some((v) => v.titel === "Perplexity"), false);
test("de llms.txt-bevinding hoort bij dit onderdeel", perSleutel["ai-vindbaarheid"].bevindingen.some((b) => b.titel === "llms.txt"), true);

console.log("\nprioriteit en samenvatting");
test("een kaart per onderdeel", r.samenvatting.length, 7);
test("de zwaarste staat vooraan", r.samenvatting[0].prioriteit >= r.samenvatting[6].prioriteit, true);
test("elke kaart heeft een vraag, kop en slotzin", r.samenvatting.every((k) => k.vraag && k.kop && k.slotzin), true);
test("nul modellen die het bedrijf noemen weegt het zwaarst", (() => {
  const niemand = rapportVanScan(scan({
    zichtbaarheid: {
      score: 0, gevonden: 0, getest: 2,
      resultaten: {
        openai: { success: true, target_found: false, competitors: [] },
        anthropic: { success: true, target_found: false, competitors: [] },
        gemini: { success: false, target_found: false, competitors: [] },
        perplexity: { success: false, target_found: false, competitors: [] },
      },
    },
  }));
  return niemand.onderdelen.find((o) => o.sleutel === "ai-vindbaarheid").prioriteit === 5;
})(), true);

console.log("\nherkomst");
test("het aantal controles wordt geteld, niet verzonnen", r.herkomst.controles > 0, true);
test("het meetmoment wordt overgenomen", r.herkomst.gemetenOp, "2026-08-26T12:00:00.000Z");
test("waarschuwingen van de scan komen bij 'niet beoordeeld'", (() => {
  const metWaarschuwing = rapportVanScan(scan({ waarschuwingen: ["De site blokkeert bots."] }));
  return metWaarschuwing.nietBeoordeeld.includes("De site blokkeert bots.");
})(), true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
