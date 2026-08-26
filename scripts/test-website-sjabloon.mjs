/**
 * Tests voor lib/website-sjabloon.ts. Draaien: npm run test:prototype
 */
import { bouwStatischPrototype } from "../lib/website-sjabloon.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

console.log("bouwStatischPrototype — website");
const site = bouwStatischPrototype({ bedrijf: "Test & Co", plaats: "Utrecht", branche: "Horeca", type: "website" });
test("bevat de bedrijfsnaam (escaped)", site.includes("Test &amp; Co"), true);
test("bevat de plaats", site.includes("Utrecht"), true);
test("geen telefoonkader in website-variant", site.includes("telefoon"), false);
test("geen script-tags (geen JS)", /<script/i.test(site), false);

console.log("\nbouwStatischPrototype — app");
const app = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: null, type: "app" });
test("app-variant heeft een telefoonkader", app.includes("telefoon"), true);
test("onbekende/lege branche valt terug op Overig", app.includes("Graag tot uw dienst"), true);

console.log("\nbouwStatischPrototype — onbekende branche");
const onbekend = bouwStatischPrototype({ bedrijf: "X", plaats: null, branche: "Iets Onbekends", type: "website" });
test("onbekende branche valt terug op Overig", onbekend.includes("Graag tot uw dienst"), true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
