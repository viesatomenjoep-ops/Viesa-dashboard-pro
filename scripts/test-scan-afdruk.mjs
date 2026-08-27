/**
 * Tests voor lib/scan-afdruk.ts. Draaien: npm run test:scan-afdruk
 *
 * Waarom dit los getest wordt: het uitpakken van de schermafdruk faalt stil.
 * Verplaatst Google het veld, of komt er een lege string terug, dan krijg je
 * geen foutmelding maar een klant die zijn rapport opent met "geen
 * schermafdruk beschikbaar" op de omslag waar zijn eigen site hoort te staan.
 */
import { kiesSchermafdruk } from "../lib/scan-afdruk.ts";

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

/** Een geldige data-URI begint met de kenmerkende bytes van een echt beeld. */
const beeld = (merk) => "data:image/jpeg;base64,/9j/" + merk.repeat(40);
const FINAL = beeld("A");
const VOLLEDIG = beeld("B");

console.log("\nkiesSchermafdruk — welke afdruk wint");

test(
  "final-screenshot is de eerste keuze",
  kiesSchermafdruk({
    audits: { "final-screenshot": { details: { data: FINAL } } },
    fullPageScreenshot: { screenshot: { data: VOLLEDIG } },
  }),
  FINAL,
);

// De volledige pagina is de terugval: in een venster van 16:10 zie je daar
// alleen de bovenrand van, dus liever het beeld boven de vouw.
test(
  "zonder final-screenshot valt hij terug op de volledige pagina",
  kiesSchermafdruk({ fullPageScreenshot: { screenshot: { data: VOLLEDIG } } }),
  VOLLEDIG,
);

console.log("\nkiesSchermafdruk — wat er niet doorheen mag");

test("niets in, niets uit", kiesSchermafdruk(null), null);
test("een leeg antwoord", kiesSchermafdruk({}), null);
test("audits zonder de afdruk", kiesSchermafdruk({ audits: { "largest-contentful-paint": {} } }), null);
test("een audit die null is", kiesSchermafdruk({ audits: { "final-screenshot": null } }), null);
test(
  "details zonder data",
  kiesSchermafdruk({ audits: { "final-screenshot": { details: {} } } }),
  null,
);

// Een lege string is precies wat er terugkwam toen dit misging: waarheidswaarde
// false, maar wel een string — een naïeve controle laat 'm door.
test(
  "een lege string telt niet als afdruk",
  kiesSchermafdruk({ audits: { "final-screenshot": { details: { data: "" } } } }),
  null,
);
test(
  "een pad is geen data-URI",
  kiesSchermafdruk({ audits: { "final-screenshot": { details: { data: "/beeld.jpg" } } } }),
  null,
);
// Een lading die niet als een beeldbestand begint is geen beeld, hoe lang hij
// ook is. Zo hoeven we geen minimumlengte te gokken.
test(
  "base64 die niet als een beeld begint telt niet",
  kiesSchermafdruk({
    audits: { "final-screenshot": { details: { data: "data:image/jpeg;base64," + "A".repeat(500) } } },
  }),
  null,
);
test(
  "een object in plaats van een string",
  kiesSchermafdruk({ audits: { "final-screenshot": { details: { data: { url: FINAL } } } } }),
  null,
);

// Valt de eerste keuze af, dan moet de terugval alsnog gepakt worden — niet
// stoppen bij de eerste lege kandidaat.
test(
  "een lege final-screenshot laat de terugval staan",
  kiesSchermafdruk({
    audits: { "final-screenshot": { details: { data: "" } } },
    fullPageScreenshot: { screenshot: { data: VOLLEDIG } },
  }),
  VOLLEDIG,
);

const PNG = "data:image/png;base64,iVBOR" + "C".repeat(40);
test("png mag ook", kiesSchermafdruk({ audits: { "final-screenshot": { details: { data: PNG } } } }), PNG);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
