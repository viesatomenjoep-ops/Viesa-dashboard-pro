/**
 * Regressietests voor lib/audit.ts — de parser en de domeinvergelijking.
 *
 * Juist deze twee gaan stil fout. Een parser die op één invoervorm struikelt
 * geeft geen foutmelding maar een lege lijst, en dan lijkt het alsof een model
 * niets wist. Een domeinvergelijking die te ruim is, meldt "u wordt gevonden"
 * terwijl er een ander bedrijf staat — precies de conclusie waar een verkoop op
 * rust.
 *
 * Twee van de gevallen hieronder vonden bij het schrijven echte bugs:
 * de kale array (`[{...}]`) en de afwijkende veldnamen.
 *
 * Draaien:  npm run test:audit
 */
import { parseConcurrenten, hostVan, doelGevonden } from "../lib/audit.ts";

let goed = 0;
let fout = 0;

function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) {
    goed++;
    console.log(`  ok   ${naam}`);
  } else {
    fout++;
    console.log(`  FOUT ${naam}`);
    console.log(`       verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`       kreeg:    ${JSON.stringify(echt)}`);
  }
}

console.log("\nparseConcurrenten — modellen houden zich niet aan 'raw JSON'");
test("kale JSON", parseConcurrenten('{"competitors":[{"name":"A","url":"a.nl"}]}').length, 1);
test(
  "markdown-blok eromheen",
  parseConcurrenten('```json\n{"competitors":[{"name":"A","url":"a.nl"}]}\n```').length,
  1,
);
test(
  "inleidende en afsluitende praat",
  parseConcurrenten('Here you go:\n{"competitors":[{"name":"A","url":"a.nl"}]}\nHope that helps!')
    .length,
  1,
);
test("kale array zonder wikkel", parseConcurrenten('[{"name":"A","url":"a.nl"}]').length, 1);
test(
  "afwijkende veldnamen (company/website)",
  parseConcurrenten('[{"company":"A","website":"a.nl"}]')[0]?.name,
  "A",
);
test(
  "hoogstens vijf",
  parseConcurrenten(
    JSON.stringify({
      competitors: Array.from({ length: 9 }, (_, i) => ({ name: `n${i}`, url: `u${i}` })),
    }),
  ).length,
  5,
);
test("weigering geeft lege lijst", parseConcurrenten("sorry, I cannot help").length, 0);
test("lege invoer", parseConcurrenten("").length, 0);

console.log("\nhostVan — kale hostnaam");
test("https + www + pad", hostVan("https://www.viesa-automations.nl/diensten"), "viesa-automations.nl");
test("kaal domein", hostVan("viesa-automations.nl"), "viesa-automations.nl");
test("hoofdletters en poort", hostVan("HTTP://Example.COM:8080/x?y=1"), "example.com");
test("subdomein blijft staan", hostVan("https://shop.example.com"), "shop.example.com");

console.log("\ndoelGevonden — te ruim matchen is erger dan te streng");
const met = (url) => [{ name: "X", url }];
test("exacte treffer", doelGevonden("viesa-automations.nl", met("https://www.viesa-automations.nl")), true);
test("treffer met pad", doelGevonden("https://viesa-automations.nl", met("https://viesa-automations.nl/over-ons")), true);
test("subdomein van het doel telt mee", doelGevonden("example.com", met("https://shop.example.com")), true);
test("ander domein telt niet", doelGevonden("viesa-automations.nl", met("https://concurrent.nl")), false);
test("deelstring mag niet matchen", doelGevonden("viesa.nl", met("https://nietviesa.nl")), false);
test("leeg doel", doelGevonden("", met("https://a.nl")), false);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
