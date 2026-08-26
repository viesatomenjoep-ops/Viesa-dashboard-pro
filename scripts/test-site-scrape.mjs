/**
 * Tests voor lib/site-parse.ts — het parseerwerk achter de site-scraper.
 * Draaien: npm run test:scrape
 *
 * De netwerkkant (haalEchteContent) blijft ongetest — dat is een fetch. Wat
 * hier getest wordt is het stuk dat stil fout gaat: welke koppen en teksten we
 * uit de HTML halen, en welke rommel we eruit houden.
 */
import { tekstVan, vindKop, vindNavigatie, vindSecties } from "../lib/site-parse.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

console.log("tekstVan");
test("tags eruit", tekstVan("<span>Hallo <b>daar</b></span>"), "Hallo daar");
test("entiteiten vertaald", tekstVan("Fokkerij &amp; handel"), "Fokkerij & handel");
test("harde spaties worden gewone spaties", tekstVan("een&nbsp;twee"), "een twee");
test("witruimte wordt samengevouwen", tekstVan("een\n\n   twee"), "een twee");

console.log("\nvindKop");
test("de h1 komt eruit", vindKop("<h1>Professionele paardenfokkerij</h1>"), "Professionele paardenfokkerij");
test("opmaak binnen de h1 stoort niet", vindKop('<h1 class="x">Wij maken <em>werkprocessen</em> slimmer</h1>'), "Wij maken werkprocessen slimmer");
test("geen h1 geeft null", vindKop("<h2>Alleen een h2</h2>"), null);
test("een h1 met menu-rommel telt niet", vindKop("<h1>Cookie-instellingen</h1>"), null);
test("een veel te lange h1 is geen kop maar een zin", vindKop(`<h1>${"woord ".repeat(30)}</h1>`), null);

console.log("\nvindSecties");
const pagina = `
  <h2>Onze hengsten</h2>
  <p>Wij fokken al ruim veertig jaar springpaarden van internationaal niveau.</p>
  <h2>Africhting</h2>
  <p>Van jong paard tot wedstrijdklaar begeleiden wij elk paard stap voor stap.</p>
  <h3>Cookiebeleid</h3>
  <p>Deze website gebruikt cookies om uw voorkeuren te onthouden en verkeer te meten.</p>
  <h2>Contact</h2>
  <p>Kort.</p>
`;
const secties = vindSecties(pagina);
test("twee bruikbare secties gevonden", secties.length, 2);
test("de titel klopt", secties[0].titel, "Onze hengsten");
test("de tekst eronder komt mee", secties[0].tekst.startsWith("Wij fokken al ruim veertig jaar"), true);
test("een cookie-kop wordt geweerd", secties.some((s) => /cookie/i.test(s.titel)), false);
test("een kop met een te korte tekst valt af", secties.some((s) => s.titel === "Contact"), false);
test("dezelfde kop telt maar één keer", vindSecties(`
  <h2>Diensten</h2><p>Wij verzorgen onderhoud, reparatie en periodieke keuring van uw installatie.</p>
  <h2>Diensten</h2><p>Wij verzorgen onderhoud, reparatie en periodieke keuring van uw installatie.</p>
`).length, 1);
test("een lange tekst wordt afgekapt met een beletselteken", (() => {
  const s = vindSecties(`<h2>Over ons</h2><p>${"lange tekst ".repeat(40)}</p>`);
  return s[0].tekst.length <= 200 && s[0].tekst.endsWith("…");
})(), true);
test("niet meer dan zes secties", vindSecties(
  Array.from({ length: 12 }, (_, i) => `<h2>Kop ${i}</h2><p>Een voldoende lange omschrijving van dit onderdeel van de site.</p>`).join(""),
).length, 6);

console.log("\nvindNavigatie");
test("menu-items uit de nav", vindNavigatie("<nav><a href='/'>Home</a><a href='/diensten'>Diensten</a></nav>"), ["Home", "Diensten"]);
test("terugval op de header als er geen nav is", vindNavigatie("<header><a href='/'>Start</a></header>"), ["Start"]);
test("dubbele items eruit", vindNavigatie("<nav><a>Home</a><a>home</a><a>Contact</a></nav>"), ["Home", "Contact"]);
test("winkelwagen en zoeken tellen niet als pagina", vindNavigatie("<nav><a>Home</a><a>Winkelwagen</a><a>Zoeken</a></nav>"), ["Home"]);
test("hooguit zes items", vindNavigatie(`<nav>${Array.from({ length: 10 }, (_, i) => `<a>Item${i}</a>`).join("")}</nav>`).length, 6);
test("zonder nav of header een lege lijst", vindNavigatie("<div><a>Los</a></div>"), []);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
