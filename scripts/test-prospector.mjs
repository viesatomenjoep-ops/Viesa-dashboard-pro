/**
 * Tests voor de prospector-bronnen. Draaien: npm run test:prospector
 *
 * Het netwerkdeel van elke bron blijft ongetest — dat is een fetch. Getest
 * wordt wat stil fout gaat: welke resultaten we wél en niet als lead meenemen,
 * en of een verkeerd samengestelde zoekopdracht opvalt (een foute
 * Overpass-query geeft namelijk geen foutmelding maar nul resultaten).
 */
import { bedrijfsnaamUit, hostVanUrl, isBedrijfssite } from "../lib/prospector/types.ts";
import { bouwOverpassQuery, osmNaarRijen } from "../lib/prospector/osm.ts";
import { bouwZoekopdracht, treffersNaarRijen } from "../lib/prospector/websearch.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

console.log("hostVanUrl");
test("www valt weg", hostVanUrl("https://www.Voorbeeld.NL/pad"), "voorbeeld.nl");
test("zonder protocol werkt ook", hostVanUrl("voorbeeld.nl"), "voorbeeld.nl");
test("onzin geeft null", hostVanUrl("geen url"), null);

console.log("\nisBedrijfssite — platforms zijn geen leads");
test("een eigen site telt mee", isBedrijfssite("stoeterijrenken.nl"), true);
test("LinkedIn niet", isBedrijfssite("linkedin.com"), false);
test("ook een subdomein van LinkedIn niet", isBedrijfssite("nl.linkedin.com"), false);
test("Facebook niet", isBedrijfssite("facebook.com"), false);
test("de telefoongids niet", isBedrijfssite("detelefoongids.nl"), false);
test("een naam die toevallig eindigt op een platformnaam wél", isBedrijfssite("nietfacebook.com"), true);
test("null is geen site", isBedrijfssite(null), false);

console.log("\nbedrijfsnaamUit — titels van zoekresultaten");
test("alles na het streepje valt weg", bedrijfsnaamUit("Stoeterij Renken - Paardenfokkerij"), "Stoeterij Renken");
test("ook bij een pijp", bedrijfsnaamUit("Bakkerij Jansen | Vers uit eigen oven"), "Bakkerij Jansen");
test("een lange streep telt ook", bedrijfsnaamUit("Van Dijk BV — Groothandel"), "Van Dijk BV");
test("zonder scheidingsteken blijft alles staan", bedrijfsnaamUit("Café De Zwaan"), "Café De Zwaan");
test("een te kort eerste deel wordt niet afgeknipt", bedrijfsnaamUit("A - Grote Naam BV"), "A - Grote Naam BV");
test("witruimte wordt opgeruimd", bedrijfsnaamUit("  Test   BV  "), "Test BV");

console.log("\nbouwOverpassQuery");
const query = bouwOverpassQuery({ zoekterm: "bakkerij", locatie: "Breda", maxResultaten: 30 });
test("de plaats staat in het zoekgebied", query.includes('area["name"~"^Breda$",i]'), true);
test("er wordt op vier sleutels gezocht", ["shop", "office", "craft", "name"].every((k) => query.includes(`["${k}"~"bakkerij",i]`)), true);
test("elke regel eist een website", (query.match(/\["website"\]/g) ?? []).length, 4);
test("het maximum komt in de uitvoerregel", query.includes("out center 30"), true);
test("een land achter de komma valt weg", bouwOverpassQuery({ zoekterm: "x", locatie: "Utrecht, Nederland", maxResultaten: 5 }).includes('^Utrecht$'), true);
test("tekens die de query kunnen breken worden verwijderd", (() => {
  const q = bouwOverpassQuery({ zoekterm: 'a"]["b', locatie: "X", maxResultaten: 5 });
  // De zoekterm komt er ontdaan van aanhalingstekens en haken uit; zou hij
  // ongewijzigd doorgegeven worden, dan sluit hij de Overpass-expressie af.
  return q.includes('["shop"~"ab",i]') && !q.includes('a"][');
})(), true);
test("een absurd hoog maximum wordt begrensd", bouwOverpassQuery({ zoekterm: "x", locatie: "X", maxResultaten: 99999 }).includes("out center 200"), true);

console.log("\nosmNaarRijen");
const elementen = [
  { type: "node", id: 1, tags: { name: "Bakkerij Jansen", website: "https://www.jansen.nl", shop: "bakery", "addr:city": "Breda", "addr:street": "Dorpsstraat", "addr:housenumber": "12", phone: "076-1234567" } },
  { type: "way", id: 2, tags: { name: "Zonder Site BV", shop: "bakery" } },
  { type: "node", id: 3, tags: { name: "Facebook-only BV", website: "https://facebook.com/pagina", shop: "bakery" } },
  { type: "node", id: 4, tags: { name: "Jansen filiaal 2", website: "https://jansen.nl/filiaal", shop: "bakery" } },
  { type: "node", id: 5, tags: { website: "https://naamloos.nl" } },
];
const rijen = osmNaarRijen(elementen, 20);
test("alleen bruikbare bedrijven blijven over", rijen.length, 1);
test("de naam komt mee", rijen[0].bedrijf, "Bakkerij Jansen");
test("de website wordt genormaliseerd", rijen[0].website, "https://jansen.nl");
test("adres wordt samengesteld", rijen[0].adres, "Dorpsstraat 12");
test("plaats en telefoon komen mee", [rijen[0].plaats, rijen[0].telefoon], ["Breda", "076-1234567"]);
test("de branche wordt leesbaar gemaakt", rijen[0].branche, "Bakery");
test("de osm-sleutel gaat in het place_id-veld", rijen[0].place_id, "osm:node/1");
test("een tweede vestiging op hetzelfde domein telt niet dubbel", rijen.some((r) => r.bedrijf === "Jansen filiaal 2"), false);
test("het maximum wordt gerespecteerd", osmNaarRijen(
  Array.from({ length: 10 }, (_, i) => ({ type: "node", id: i, tags: { name: `Bedrijf ${i}`, website: `https://bedrijf${i}.nl` } })),
  3,
).length, 3);

console.log("\nbouwZoekopdracht");
const opdracht = bouwZoekopdracht("webshop", "Antwerpen");
test("zoekterm en locatie staan erin", opdracht.startsWith("webshop Antwerpen"), true);
test("platforms worden bij de bron al uitgesloten", opdracht.includes("-site:linkedin.com"), true);

console.log("\ntreffersNaarRijen");
const treffers = [
  { titel: "Van Dijk Groothandel - Al 40 jaar", url: "https://www.vandijk.nl/over-ons" },
  { titel: "Van Dijk Groothandel - Contact", url: "https://vandijk.nl/contact" },
  { titel: "Van Dijk op LinkedIn", url: "https://linkedin.com/company/vandijk" },
  { titel: "Bakkerij Pietersen", url: "https://pietersen.be" },
  { titel: "", url: "https://leeg.nl" },
];
const web = treffersNaarRijen(treffers, { maxResultaten: 20, branche: "groothandel" });
test("twee bedrijven, niet vijf treffers", web.length, 2);
test("twee pagina's op hetzelfde domein zijn één lead", web.filter((r) => r.website === "https://vandijk.nl").length, 1);
test("de slogan valt van de naam af", web[0].bedrijf, "Van Dijk Groothandel");
test("een LinkedIn-pagina wordt geen lead", web.some((r) => r.website.includes("linkedin")), false);
test("een treffer zonder titel valt af", web.some((r) => r.website === "https://leeg.nl"), false);
test("de zoekterm wordt de branche", web[0].branche, "groothandel");
test("het domein is de ontdubbelsleutel", web[0].place_id, "web:vandijk.nl");
test("het maximum wordt gerespecteerd", treffersNaarRijen(treffers, { maxResultaten: 1 }).length, 1);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
