/**
 * Tests voor lib/website-sjabloon.ts. Draaien: npm run test:prototype
 */
import { bouwStatischPrototype, SJABLOON_BRANCHES } from "../lib/website-sjabloon.ts";

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

console.log("\narchetypes per branche");
const webshop = bouwStatischPrototype({ bedrijf: "Shop BV", plaats: null, branche: "E-commerce / webshop", type: "website" });
test("webshop heeft een zoekbalk", webshop.includes("Waar ben je naar op zoek?"), true);
const groothandel = bouwStatischPrototype({ bedrijf: "Bulk BV", plaats: null, branche: "Groothandel", type: "website" });
test("premium-stijl heeft genummerde kaarten", groothandel.includes(">01<"), true);
const horeca2 = bouwStatischPrototype({ bedrijf: "Café Test", plaats: "Breda", branche: "Horeca", type: "website" });
test("horeca heeft de menukaart", horeca2.includes("Menukaart"), true);
const corporate = bouwStatischPrototype({ bedrijf: "Advies BV", plaats: null, branche: "Zakelijke dienstverlening", type: "website" });
test("corporate heeft een werkwijze-stap", corporate.includes("Kennismaken"), true);
test("elke branche levert geldige, unieke HTML", (() => {
  const gezien = new Set();
  for (const b of SJABLOON_BRANCHES) {
    const html = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: b, type: "website" });
    if (!html.startsWith("<!doctype html>") || /<script/i.test(html)) return `ongeldig: ${b}`;
    gezien.add(html);
  }
  return gezien.size === SJABLOON_BRANCHES.length ? true : "duplicaten";
})(), true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
