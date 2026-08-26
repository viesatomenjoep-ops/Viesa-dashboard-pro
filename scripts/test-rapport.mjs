/**
 * Tests voor lib/rapport/schaal.ts — de rekenkant van de meetbalk.
 * Draaien: npm run test:rapport
 */
import {
  asDecimalen,
  asWaarden,
  getal,
  maximumVan,
  positieOp,
  standVan,
  standVanScore,
  zoneBreedtes,
  zoneVan,
} from "../lib/rapport/schaal.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

// De laadtijdschaal uit het rapport: lager is beter.
const laadtijd = {
  zones: [
    { tot: 1.8, stand: "goed", label: "snel" },
    { tot: 3.0, stand: "beter", label: "kan beter" },
    { tot: 5.0, stand: "nodig", label: "traag" },
  ],
};

// Een scoreschaal: hoger is beter. Zelfde structuur, andere volgorde van standen.
const score = {
  zones: [
    { tot: 49, stand: "nodig", label: "aandacht nodig" },
    { tot: 79, stand: "beter", label: "kan beter" },
    { tot: 100, stand: "goed", label: "goed" },
  ],
};

console.log("maximumVan / asWaarden");
test("maximum is de bovengrens van de laatste zone", maximumVan(laadtijd), 5.0);
test("aswaarden zijn de ondergrens plus elke zonegrens", asWaarden(laadtijd), [0, 1.8, 3.0, 5.0]);
test("lege schaal heeft maximum 0", maximumVan({ zones: [] }), 0);

console.log("\nzoneVan — lager is beter");
test("2,2 s valt in 'kan beter'", zoneVan(laadtijd, 2.2)?.label, "kan beter");
test("grens hoort bij de zone eronder", zoneVan(laadtijd, 1.8)?.label, "snel");
test("net over de grens is de volgende zone", zoneVan(laadtijd, 1.81)?.label, "kan beter");
test("nul valt in de eerste zone", zoneVan(laadtijd, 0)?.label, "snel");
test("ver buiten de as valt in de laatste zone", zoneVan(laadtijd, 30)?.label, "traag");

console.log("\nzoneVan — hoger is beter (zelfde structuur)");
test("92 is goed", zoneVan(score, 92)?.stand, "goed");
test("66 kan beter", zoneVan(score, 66)?.stand, "beter");
test("12 vraagt aandacht", zoneVan(score, 12)?.stand, "nodig");

console.log("\nstandVan");
test("niet gemeten geeft 'geen', niet 'nodig'", standVan(laadtijd, null), "geen");
test("gemeten waarde geeft de stand van zijn zone", standVan(laadtijd, 4.4), "nodig");

console.log("\npositieOp");
test("ondergrens staat op 0%", positieOp(laadtijd, 0), 0);
test("bovengrens staat op 100%", positieOp(laadtijd, 5), 100);
test("de helft van de as staat op 50%", positieOp(laadtijd, 2.5), 50);
test("waarde boven de as wordt afgekapt op 100", positieOp(laadtijd, 30), 100);
test("negatieve waarde wordt afgekapt op 0", positieOp(laadtijd, -2), 0);
test("schaal met een eigen ondergrens rekent daar vanaf", positieOp({ vanaf: 10, zones: [{ tot: 20, stand: "goed", label: "x" }] }, 15), 50);

console.log("\nzoneBreedtes");
test("breedtes tellen op tot 100", Math.round(zoneBreedtes(laadtijd).reduce((a, b) => a + b, 0)), 100);
test("eerste zone is 36% van de as", Math.round(zoneBreedtes(laadtijd)[0]), 36);
test("gelijke zones geven gelijke breedtes", zoneBreedtes({
  zones: [
    { tot: 50, stand: "goed", label: "a" },
    { tot: 100, stand: "nodig", label: "b" },
  ],
}), [50, 50]);

console.log("\nstandVanScore — de norm bepaalt het oordeel, niet een vaste 50");
test("op de norm is goed", standVanScore(80, 80), "goed");
test("net onder de norm kan beter", standVanScore(79, 80), "beter");
test("driekwart van de norm kan nog beter", standVanScore(60, 80), "beter");
test("daaronder vraagt aandacht", standVanScore(59, 80), "nodig");
test("een strengere norm verschuift het oordeel mee", standVanScore(70, 95), "nodig");
test("niet gemeten telt niet als slecht", standVanScore(null, 80), "geen");

console.log("\nasDecimalen — één decimaalaantal per as, zonder afronding");
test("hele getallen hebben geen decimalen nodig", asDecimalen(score), 0);
test("1,8 vraagt om één decimaal", asDecimalen(laadtijd), 1);
test("0,25 vraagt om twee — met één zou hij als 0,3 verschijnen", asDecimalen({
  zones: [
    { tot: 0.1, stand: "goed", label: "a" },
    { tot: 0.25, stand: "beter", label: "b" },
    { tot: 0.5, stand: "nodig", label: "c" },
  ],
}), 2);
test("de as pakt het hoogste aantal van al zijn grenzen", asDecimalen({
  zones: [
    { tot: 1, stand: "goed", label: "a" },
    { tot: 2.125, stand: "nodig", label: "b" },
  ],
}), 3);
test("meer decimalen dan het maximum wordt afgekapt", asDecimalen({
  zones: [{ tot: 0.123456, stand: "goed", label: "a" }],
}, 2), 2);

console.log("\ngetal — Nederlandse notatie");
test("komma als decimaalteken", getal(2.2, 1), "2,2");
test("drie decimalen", getal(0.039, 3), "0,039");
test("zonder decimalen afgerond", getal(66.4), "66");

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
