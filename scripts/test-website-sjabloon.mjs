/**
 * Tests voor lib/website-sjabloon.ts. Draaien: npm run test:prototype
 */
import { bouwStatischPrototype, DESIGN_SYSTEMS, SJABLOON_BRANCHES } from "../lib/website-sjabloon.ts";

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
console.log("\necht (foto + omschrijving van de bestaande site)");
const metFoto = bouwStatischPrototype({
  bedrijf: "Foto BV",
  plaats: null,
  branche: "Horeca",
  type: "website",
  echt: { titel: "Foto BV — Home", beschrijving: "Een gezellig café in het centrum.", afbeeldingen: ["https://example.com/foto.jpg"], logo: null, merkkleur: null },
});
test("echte foto komt terug als <img>", metFoto.includes('https://example.com/foto.jpg'), true);
test("echte omschrijving vervangt de generieke subtitel", metFoto.includes("Een gezellig café in het centrum."), true);
const zonderFoto = bouwStatischPrototype({ bedrijf: "Geen Foto BV", plaats: null, branche: "Horeca", type: "website", echt: null });
test("zonder echt blijft de generieke subtitel staan", zonderFoto.includes("Vers bereid, met aandacht voor seizoen en herkomst."), true);
test("app-mockup verwerkt ook een echte foto", bouwStatischPrototype({
  bedrijf: "X", plaats: null, branche: "Groothandel", type: "app",
  echt: { titel: null, beschrijving: null, afbeeldingen: ["https://example.com/a.jpg"], logo: null, merkkleur: null },
}).includes("https://example.com/a.jpg"), true);

console.log("\nnieuwe archetypes");
const tech = bouwStatischPrototype({ bedrijf: "SaaS BV", plaats: null, branche: "IT & Software", type: "website" });
test("tech-stijl heeft de gloed-orb", tech.includes('class="orb"'), true);
const vastgoed = bouwStatischPrototype({ bedrijf: "Huis BV", plaats: "Breda", branche: "Vastgoed & makelaardij", type: "website" });
test("vastgoed-stijl heeft de dienstverlening-sectie", vastgoed.includes("Onze dienstverlening"), true);
const studio = bouwStatischPrototype({ bedrijf: "Studio X", plaats: null, branche: "Marketing & creatief", type: "website" });
test("studio-stijl heeft schuine kaarten", studio.includes("rotate(-4deg)"), true);

console.log("\nlogo + huisstijl van de klant");
const metLogo = bouwStatischPrototype({
  bedrijf: "Logo BV", plaats: null, branche: "Groothandel", type: "website",
  echt: { titel: null, beschrijving: null, afbeeldingen: [], logo: "https://example.com/logo.png", merkkleur: "#123456" },
});
test("echt logo vervangt de initialenbadge", metLogo.includes("https://example.com/logo.png") && !metLogo.includes(">LB<"), true);
test("merkkleur van de klant vervangt de archetypekleur", metLogo.includes("#123456"), true);
const zonderLogo = bouwStatischPrototype({ bedrijf: "Los Bedrijf", plaats: null, branche: "Groothandel", type: "website" });
test("zonder logo blijft de initialenbadge staan", zonderLogo.includes(">LB<"), true);

test("elke branche levert geldige, unieke HTML", (() => {
  const gezien = new Set();
  for (const b of SJABLOON_BRANCHES) {
    const html = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: b, type: "website" });
    if (!html.startsWith("<!doctype html>") || /<script/i.test(html)) return `ongeldig: ${b}`;
    gezien.add(html);
  }
  return gezien.size === SJABLOON_BRANCHES.length ? true : "duplicaten";
})(), true);

console.log("\ndesign systems, los van de branche");
test("er zijn precies 10 design systems", DESIGN_SYSTEMS.length, 10);
const minimalOverride = bouwStatischPrototype({ bedrijf: "Wissel BV", plaats: null, branche: "Horeca", type: "website", stijl: "minimal" });
test("stijl-override wint van de branchestandaard", minimalOverride.includes('class="rij-nr"') && !minimalOverride.includes("watermerk"), true);
test("elk design system levert geldige, unieke HTML", (() => {
  const gezien = new Set();
  for (const d of DESIGN_SYSTEMS) {
    const html = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: "Overig", type: "website", stijl: d.key });
    if (!html.startsWith("<!doctype html>") || /<script/i.test(html)) return `ongeldig: ${d.key}`;
    gezien.add(html);
  }
  return gezien.size === DESIGN_SYSTEMS.length ? true : "duplicaten";
})(), true);
test("geen emoji in de output (professioneel, niet AI-achtig)", (() => {
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  for (const d of DESIGN_SYSTEMS) {
    const html = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: "Overig", type: "website", stijl: d.key });
    if (emojiRegex.test(html)) return `emoji in: ${d.key}`;
  }
  for (const b of SJABLOON_BRANCHES) {
    const html = bouwStatischPrototype({ bedrijf: "Test", plaats: null, branche: b, type: "app" });
    if (emojiRegex.test(html)) return `emoji in app: ${b}`;
  }
  return true;
})(), true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
