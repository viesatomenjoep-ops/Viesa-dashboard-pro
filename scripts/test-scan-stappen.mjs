/**
 * Tests voor lib/scan-stappen.ts. Draaien: npm run test:scan-stappen
 *
 * Deze tests bestaan naar aanleiding van een echte storing. `STAPPEN` kreeg er
 * een stap bij (`technologie`), maar de functie die een bewaarde scan terugzet
 * vulde nog de oude acht sleutels. De weergave las daarna `st.status` van niets,
 * en de scanpagina klapte eruit zodra je een eerdere scan opende — met alleen
 * "undefined is not an object (evaluating 't.status')" als aanwijzing.
 *
 * De eerste test hieronder is daarom de belangrijkste: élke stap moet een staat
 * krijgen. Een typecontrole vangt dat niet, want `Record<string, StapState>`
 * accepteert elke sleutelverzameling.
 */
import { STAP_SLEUTELS, beginStappen, stappenVanRapport } from "../lib/scan-stappen.ts";
import { heelScan } from "../lib/rapport/heelScan.ts";

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

function scan(aanpassing = {}) {
  return heelScan({
    url: "https://voorbeeld.nl",
    host: "voorbeeld.nl",
    niche: "webshop",
    totaalScore: 62,
    geo: { score: 55, bevindingen: [] },
    techniek: { score: 48, scores: { prestatie: 48, lcp: 3.4 } },
    zichtbaarheid: { score: 25, gevonden: 1, getest: 4, resultaten: null },
    waarschuwingen: [],
    beveiliging: { percentage: 60, bevindingen: [] },
    scripts: { bevindingen: [] },
    vindbaarheid: { bevindingen: [] },
    technologie: [{ groep: "Hosting", namen: ["Vercel"] }, { groep: "Meten", namen: ["GA4"] }],
    ...aanpassing,
  });
}

console.log("\nstappenVanRapport — elke stap krijgt een staat");

// Dit is de test die de storing had gevangen.
const stappen = stappenVanRapport(scan());
test(
  "geen enkele stap uit STAP_SLEUTELS ontbreekt",
  STAP_SLEUTELS.filter((k) => stappen[k] === undefined),
  [],
);
test(
  "elke stap heeft een status",
  STAP_SLEUTELS.filter((k) => typeof stappen[k]?.status !== "string"),
  [],
);
test("het aantal stappen klopt met de lijst", Object.keys(stappen).length, STAP_SLEUTELS.length);

// Ook bij een scan waarin vrijwel alles ontbreekt mag er geen gat vallen: dat
// is precies de rij uit de database die de storing veroorzaakte.
const kaal = stappenVanRapport(heelScan({}));
test(
  "ook een lege scan levert elke stap op",
  STAP_SLEUTELS.filter((k) => kaal[k] === undefined),
  [],
);

test(
  "beginStappen dekt dezelfde sleutels",
  STAP_SLEUTELS.filter((k) => beginStappen()[k]?.status !== "wachtend"),
  [],
);

console.log("\nstappenVanRapport — wat er per stap uit komt");

test("technologie telt de namen, niet de groepen", stappen.technologie.samenvatting, "2 herkend");
test(
  "geen technologie leest als 'Niets herkend'",
  stappenVanRapport(scan({ technologie: [] })).technologie.samenvatting,
  "Niets herkend",
);

test("een GEO-score onder 70 vraagt aandacht", stappen.structured_data.status, "aandacht");
test(
  "een GEO-score van 70 is goed",
  stappenVanRapport(scan({ geo: { score: 70, bevindingen: [] } })).structured_data.status,
  "goed",
);

test("de snelheid toont de score met noemer", stappen.snelheid.samenvatting, "48/100");
test(
  "zonder snelheidsmeting toont hij de reden",
  stappenVanRapport(scan({ techniek: { score: null, fout: "PageSpeed gaf 429." } })).snelheid
    .samenvatting,
  "PageSpeed gaf 429.",
);
// Een ontbrekende meting zonder reden mag geen leeg vakje worden.
test(
  "zonder meting én zonder reden staat er 'Niet gemeten'",
  stappenVanRapport(scan({ techniek: { score: null } })).snelheid.samenvatting,
  "Niet gemeten",
);

test(
  "zonder niche zegt de zichtbaarheid dat ook",
  stappenVanRapport(scan({ zichtbaarheid: { score: null, gevonden: 0, getest: 0, resultaten: null } }))
    .zichtbaarheid.samenvatting,
  "Geen niche gemeten",
);
test(
  "met modellen telt hij de treffers",
  stappen.zichtbaarheid.samenvatting,
  "1 van 4 modellen noemt dit bedrijf",
);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
