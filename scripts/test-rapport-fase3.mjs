/**
 * Tests voor de onderdelen die fase 3 toevoegde: toegankelijkheid, werking en
 * techniek. Draaien: npm run test:rapport-fase3
 *
 * De nadruk ligt op wat stil fout gaat. Lighthouse geeft audits terug die het
 * níét beoordeeld heeft (scoreDisplayMode "manual" of "notApplicable"); die per
 * ongeluk als gezakt tellen maakt van élke site een slechte site.
 */
import {
  aantalElementen,
  bevindingenUitAudits,
  geraakteElementen,
  isBeoordeeld,
  nietBeoordeeldeAudits,
  TOEGANKELIJKHEID,
  WERKING,
} from "../lib/rapport/lighthouse.ts";
import { kiesTweedePagina, paginaWerkt, werkingScore } from "../lib/rapport/paginas.ts";
import { aantalTechnologieen, heeftMeting, herkenTechnologie } from "../lib/rapport/technologie.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

console.log("isBeoordeeld — niet elke audit is een uitspraak");
test("een gezakte audit telt mee", isBeoordeeld({ score: 0, scoreDisplayMode: "binary" }), true);
test("een geslaagde audit telt mee", isBeoordeeld({ score: 1, scoreDisplayMode: "binary" }), true);
test("'manual' is géén uitspraak", isBeoordeeld({ score: null, scoreDisplayMode: "manual" }), false);
test("'notApplicable' ook niet", isBeoordeeld({ score: null, scoreDisplayMode: "notApplicable" }), false);
test("'informative' ook niet", isBeoordeeld({ score: 0, scoreDisplayMode: "informative" }), false);
test("zonder score geen uitspraak", isBeoordeeld({ scoreDisplayMode: "binary" }), false);

console.log("\naantalElementen");
test("telt de gevonden elementen", aantalElementen({ details: { items: [1, 2, 3] } }), 3);
test("zonder details nul", aantalElementen({}), 0);

console.log("\nbevindingenUitAudits");
const audits = {
  "color-contrast": { score: 0, scoreDisplayMode: "binary", details: { items: new Array(9) } },
  "link-name": { score: 0, scoreDisplayMode: "binary", details: { items: new Array(5) } },
  "html-has-lang": { score: 1, scoreDisplayMode: "binary" },
  "heading-order": { score: 0, scoreDisplayMode: "binary", details: { items: new Array(2) } },
  bypass: { score: null, scoreDisplayMode: "manual" },
  "document-title": { score: 1, scoreDisplayMode: "binary" },
};
const bev = bevindingenUitAudits(audits, TOEGANKELIJKHEID);
test("alleen beoordeelde audits komen erin", bev.length, 5);
test("de handmatige audit valt af", bev.some((b) => b.titel.includes("menu over te slaan")), false);
test("het aantal elementen komt mee", bev.find((b) => b.titel === "te weinig contrast met de achtergrond").aantal, "9 elementen");
test("de zwaarste staat vooraan", bev[0].ernst, "ernstig");
test("een geslaagde audit is goed en draagt geen advies", (() => {
  const b = bev.find((x) => x.titel.includes("geen taal vastgelegd"));
  return b.goed === true && b.advies === undefined;
})(), true);
test("een gezakte audit heeft wél advies", bev.find((b) => b.titel === "links zonder leesbare tekst").advies.length > 10, true);
test("enkelvoud bij één element", bevindingenUitAudits(
  { "image-alt": { score: 0, scoreDisplayMode: "binary", details: { items: [1] } } },
  TOEGANKELIJKHEID,
)[0].aantal, "1 element");

console.log("\ngeraakteElementen");
test("telt over alle gezakte audits heen", geraakteElementen(audits, TOEGANKELIJKHEID), 16);
test("geslaagde audits tellen niet mee", geraakteElementen(
  { "html-has-lang": { score: 1, scoreDisplayMode: "binary", details: { items: new Array(5) } } },
  TOEGANKELIJKHEID,
), 0);

console.log("\nnietBeoordeeldeAudits — regel 4 uit het bouwplan");
test("de handmatige audit wordt gemeld", nietBeoordeeldeAudits(audits, TOEGANKELIJKHEID).length, 1);
test("beoordeelde audits staan er niet bij", nietBeoordeeldeAudits(
  { "color-contrast": { score: 0, scoreDisplayMode: "binary" } },
  TOEGANKELIJKHEID,
).length, 0);

console.log("\nWERKING-woordenboek");
test("consolefouten worden vertaald", bevindingenUitAudits(
  { "errors-in-console": { score: 0, scoreDisplayMode: "binary", details: { items: new Array(3) } } },
  WERKING,
)[0].titel, "fouten in de browser");

console.log("\nkiesTweedePagina");
const home = `
  <a href="/">Home</a>
  <a href="/winkelwagen">Winkelwagen</a>
  <a href="https://facebook.com/x">Facebook</a>
  <a href="/brochure.pdf">Brochure</a>
  <a href="/contact">Contact</a>
  <a href="/producten/stoelen">Stoelen</a>
`;
test("een productpagina heeft voorrang op contact", kiesTweedePagina(home, "https://x.nl"), "https://x.nl/producten/stoelen");
test("de winkelwagen telt niet als inhoudspagina", kiesTweedePagina('<a href="/winkelwagen">W</a>', "https://x.nl"), null);
test("een PDF is geen pagina", kiesTweedePagina('<a href="/folder.pdf">F</a>', "https://x.nl"), null);
test("een externe link telt niet", kiesTweedePagina('<a href="https://ander.nl/x">A</a>', "https://x.nl"), null);
test("de homepage zelf telt niet", kiesTweedePagina('<a href="/">Home</a>', "https://x.nl"), null);
test("zonder links geen tweede pagina", kiesTweedePagina("<p>niets</p>", "https://x.nl"), null);
test("anders gewoon de eerste interne pagina", kiesTweedePagina('<a href="/iets-anders">X</a>', "https://x.nl"), "https://x.nl/iets-anders");
test("een anker wordt weggehaald", kiesTweedePagina('<a href="/over#team">Over</a>', "https://x.nl"), "https://x.nl/over");
test("mailto en tel worden overgeslagen", kiesTweedePagina('<a href="mailto:a@b.nl">M</a><a href="tel:06">T</a>', "https://x.nl"), null);

console.log("\npaginaWerkt / werkingScore");
const ok = { url: "https://x.nl", status: 200, https: true, laadtijdMs: 120 };
test("200 via https werkt", paginaWerkt(ok), true);
test("een 404 werkt niet", paginaWerkt({ ...ok, status: 404 }), false);
test("zonder https werkt niet", paginaWerkt({ ...ok, https: false }), false);
test("een doorverwijzing telt nog als werkend", paginaWerkt({ ...ok, status: 301 }), true);
test("een fout telt niet als werkend", paginaWerkt({ ...ok, fout: "Timeout" }), false);
test("twee goede pagina's geven 100", werkingScore([ok, ok]), 100);
test("één van de twee geeft 50", werkingScore([ok, { ...ok, status: 500 }]), 50);
test("niets gemeten geeft null, geen nul", werkingScore([]), null);

console.log("\nherkenTechnologie");
const groepen = herkenTechnologie(
  '<html><head><script src="/wp-content/x.js"></script><script src="https://www.googletagmanager.com/gtm.js"></script></head><body class="woocommerce"></body></html>',
  { server: "nginx", "strict-transport-security": "max-age=31536000" },
);
test("winkelsoftware wordt herkend", groepen.find((g) => g.groep === "Winkelsoftware").namen, ["WooCommerce"]);
test("contentbeheer wordt herkend", groepen.find((g) => g.groep === "Contentbeheer").namen, ["WordPress"]);
test("hosting komt uit de headers", groepen.find((g) => g.groep === "Hosting").namen, ["Nginx"]);
test("meetsoftware wordt herkend", groepen.find((g) => g.groep === "Meten").namen, ["Google Tag Manager"]);
test("beveiligingsheaders worden herkend", groepen.find((g) => g.groep === "Beveiliging").namen, ["HSTS"]);
test("winkelsoftware staat vooraan", groepen[0].groep, "Winkelsoftware");
test("het totaal klopt", aantalTechnologieen(groepen), 5);
test("meting gevonden", heeftMeting(groepen), true);
test("zonder meetscript is er geen meting", heeftMeting(herkenTechnologie("<html></html>", {})), false);
test("een lege pagina levert niets op", herkenTechnologie("<html></html>", {}), []);
test("dezelfde techniek telt niet dubbel", aantalTechnologieen(
  herkenTechnologie('<script src="/_next/a.js"></script><div id="__NEXT_DATA__"></div>', {}),
), 1);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
