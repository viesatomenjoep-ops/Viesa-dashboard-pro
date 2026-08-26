/**
 * Tests voor lib/geo-analyse.ts.
 *
 * De robots.txt-lezer is het meest foutgevoelige stuk van de hele scanner, en
 * tegelijk het belangrijkste: zegt hij ten onrechte "geblokkeerd", dan vertel je
 * een prospect iets onwaars. Zegt hij ten onrechte "vrij", dan mis je juist het
 * sterkste verkoopargument.
 *
 * Draaien:  npm run test:geo
 */
import { analyseerGeo, geblokkeerdeCrawlers, jsonLdTypes } from "../lib/geo-analyse.ts";

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

console.log("\ngeblokkeerdeCrawlers — hier mag geen twijfel over bestaan");

test("lege robots.txt blokkeert niets", geblokkeerdeCrawlers(""), []);

test(
  "GPTBot expliciet geweerd",
  geblokkeerdeCrawlers("User-agent: GPTBot\nDisallow: /"),
  ["GPTBot"],
);

test(
  "sterretje met Disallow / blokkeert iedereen",
  geblokkeerdeCrawlers("User-agent: *\nDisallow: /").length,
  7,
);

test(
  "sterretje met lege Disallow blokkeert niets",
  geblokkeerdeCrawlers("User-agent: *\nDisallow:"),
  [],
);

test(
  "alleen een map blokkeren telt niet als blokkade",
  geblokkeerdeCrawlers("User-agent: *\nDisallow: /admin/"),
  [],
);

test(
  "specifieke toestemming wint van een algemeen verbod",
  geblokkeerdeCrawlers("User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nDisallow:").includes(
    "GPTBot",
  ),
  false,
);

test(
  "hoofdletterongevoelig",
  geblokkeerdeCrawlers("user-agent: gptbot\ndisallow: /"),
  ["GPTBot"],
);

test(
  "commentaar wordt genegeerd",
  geblokkeerdeCrawlers("# geen bots\nUser-agent: GPTBot   # openai\nDisallow: /"),
  ["GPTBot"],
);

test(
  "meerdere agents in één blok",
  geblokkeerdeCrawlers("User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /").sort(),
  ["ClaudeBot", "GPTBot"],
);

console.log("\njsonLdTypes");
test(
  "enkel object",
  jsonLdTypes('<script type="application/ld+json">{"@type":"Organization"}</script>'),
  ["Organization"],
);
test(
  "@graph wordt uitgelezen",
  jsonLdTypes(
    '<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>',
  ),
  ["Organization", "WebSite"],
);
test(
  "kapotte JSON telt niet mee",
  jsonLdTypes('<script type="application/ld+json">{kapot</script>'),
  [],
);

console.log("\nanalyseerGeo");

const goedeSite = `<html><head>
<title>Automatisering voor webshops | Viesa</title>
<meta name="description" content="Wij koppelen webshops aan voorraad en boekhouding zodat niemand meer hoeft over te tikken.">
<script type="application/ld+json">{"@type":"Organization","name":"Viesa"}</script>
</head><body>
<h1>Automatisering voor webshops</h1>
<h2>Wat kost het</h2><ul><li>a</li><li>b</li></ul>
<h2>Hoe lang duurt het</h2><ul><li>c</li></ul>
<h2>Voor wie</h2>
<time datetime="2026-01-01">januari</time>
<p>${"woord ".repeat(400)}</p>
</body></html>`;

const a = analyseerGeo({ html: goedeSite, robotsTxt: "", llmsTxtGevonden: true });
test("goede site scoort hoog", a.score >= 90, true);
test("niche afgeleid uit de omschrijving", a.voorgesteldeNiche?.slice(0, 20), "Wij koppelen webshop");
test("geen JS-waarschuwing bij echte tekst", a.vermoedelijkJsSite, false);

const geblokkeerd = analyseerGeo({
  html: goedeSite,
  robotsTxt: "User-agent: GPTBot\nDisallow: /",
  llmsTxtGevonden: true,
});
test("blokkade kost punten", geblokkeerd.score < a.score, true);
test("blokkade staat bovenaan", geblokkeerd.bevindingen[0].ernst, "kritiek");
test("blokkade is niet goed", geblokkeerd.bevindingen[0].goed, false);

const leeg = analyseerGeo({
  html: '<html><head><title>App</title></head><body><div id="root"></div><script src="a.js"></script><script src="b.js"></script><script src="c.js"></script></body></html>',
  robotsTxt: "",
  llmsTxtGevonden: false,
});
test("lege JS-huls wordt herkend", leeg.vermoedelijkJsSite, true);
test("lege site scoort laag", leeg.score < 50, true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
