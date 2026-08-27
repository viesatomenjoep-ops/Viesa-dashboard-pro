/**
 * Tests voor lib/rapport/weergave-telling.ts. Draaien: npm run test:weergaven
 *
 * Het gaat hier om één ding: klopt wat er op de scanpagina staat als
 * belsignaal. "Gisteren geopend" moet gisteren betekenen, en de telling moet de
 * juiste scan aanwijzen — een verkeerd signaal is erger dan geen signaal, want
 * dan bel je de verkeerde prospect op het verkeerde moment.
 */
import { telWeergaven, hoeLangGeleden } from "../lib/rapport/weergave-telling.ts";

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

console.log("\ntelWeergaven — per scan optellen");

const rijen = [
  { scan_id: "a", bekeken_op: "2026-08-26T10:00:00.000Z" },
  { scan_id: "b", bekeken_op: "2026-08-25T09:00:00.000Z" },
  { scan_id: "a", bekeken_op: "2026-08-26T14:00:00.000Z" },
  { scan_id: "a", bekeken_op: "2026-08-24T08:00:00.000Z" },
];
const geteld = telWeergaven(rijen);

test("drie weergaven op scan a", geteld.get("a")?.aantal, 3);
test("één op scan b", geteld.get("b")?.aantal, 1);
test("een scan zonder weergaven staat er niet in", geteld.get("c"), undefined);

// De rijen komen gesorteerd binnen, maar daar mag de telling niet van afhangen:
// hierboven staat de nieuwste van scan a in het midden.
test("laatst is de nieuwste, ook als de volgorde rommelt", geteld.get("a")?.laatst, "2026-08-26T14:00:00.000Z");

test("een lege lijst levert een lege telling", telWeergaven([]).size, 0);

console.log("\nhoeLangGeleden — in de taal waarin je erover denkt");

const nu = new Date("2026-08-26T12:00:00.000Z");

test("vanochtend is vandaag", hoeLangGeleden("2026-08-26T08:00:00.000Z", nu), "vandaag");
// Op kalenderdagen vergelijken en niet op 24-uursblokken: gisteravond elf uur
// geleden voelt als gisteren, niet als vandaag.
test("gisteravond laat is gisteren", hoeLangGeleden("2026-08-25T23:30:00.000Z", nu), "gisteren");
test("drie dagen terug", hoeLangGeleden("2026-08-23T12:00:00.000Z", nu), "3 dagen geleden");
test("acht dagen terug is vorige week", hoeLangGeleden("2026-08-18T12:00:00.000Z", nu), "vorige week");
test("een maand terug in weken", hoeLangGeleden("2026-07-26T12:00:00.000Z", nu), "4 weken geleden");
test("een half jaar terug in maanden", hoeLangGeleden("2026-02-26T12:00:00.000Z", nu), "6 maanden geleden");

// Een datum die niet klopt mag geen "NaN dagen geleden" opleveren in een
// verkoopoverzicht.
test("onleesbare datum wordt 'onbekend'", hoeLangGeleden("geen datum", nu), "onbekend");
// Een tijdstip in de toekomst (klokverschil tussen server en database) leest
// als vandaag, niet als "-1 dagen geleden".
test("een tijdstip in de toekomst leest als vandaag", hoeLangGeleden("2026-08-27T09:00:00.000Z", nu), "vandaag");

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
