/**
 * Tests voor lib/site-checks.ts. Draaien: npm run test:checks
 */
import {
  cijferVoor,
  controleerBeveiliging,
  controleerScripts,
  controleerVindbaarheid,
  voorbeeldAfbeelding,
} from "../lib/site-checks.ts";

let goed = 0, fout = 0;
function test(naam, echt, verwacht) {
  const gelijk = JSON.stringify(echt) === JSON.stringify(verwacht);
  if (gelijk) { goed++; console.log(`  ok   ${naam}`); }
  else { fout++; console.log(`  FOUT ${naam}\n       verwacht: ${JSON.stringify(verwacht)}\n       kreeg:    ${JSON.stringify(echt)}`); }
}

console.log("cijferVoor");
test("100% is A+", cijferVoor(100), "A+");
test("0% is F", cijferVoor(0), "F");
test("55% is C", cijferVoor(55), "C");

console.log("\ncontroleerBeveiliging");
const alles = {
  "strict-transport-security": "max-age=1",
  "content-security-policy": "default-src 'self'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "geolocation=()",
};
test("alle headers + https = A+", controleerBeveiliging(alles, true).cijfer, "A+");
test("niets + geen https = F", controleerBeveiliging({}, false).cijfer, "F");
test("hoofdletterongevoelig", controleerBeveiliging({ "Strict-Transport-Security": "x" }, true).percentage > 20, true);

console.log("\ncontroleerScripts");
const html = `<script src="https://www.googletagmanager.com/gtm.js"></script>
<script src="/lokaal.js"></script>
<script>inline</script>`;
const s = controleerScripts(html, "voorbeeld.nl");
test("lokaal script telt niet als extern", s.aantal, 1);
test("GTM herkend", s.trackers, ["Google Tag Manager"]);

console.log("\ncontroleerVindbaarheid");
test(
  "noindex is kritiek",
  controleerVindbaarheid({
    html: '<meta name="robots" content="noindex">',
    robotsTxt: "",
    sitemapGevonden: false,
  }).bevindingen[0].ernst,
  "kritiek",
);
test(
  "alles aanwezig geeft geen gemiste punten",
  controleerVindbaarheid({
    html: '<html lang="nl"><link rel="canonical" href="/">',
    robotsTxt: "Sitemap: /sitemap.xml",
    sitemapGevonden: true,
  }).bevindingen.filter((b) => !b.goed).length,
  0,
);

console.log("\nvoorbeeldAfbeelding");
test(
  "og:image relatief wordt absoluut",
  voorbeeldAfbeelding('<meta property="og:image" content="/og.png">', "https://a.nl/pagina"),
  "https://a.nl/og.png",
);
test("geen og:image geeft null", voorbeeldAfbeelding("<html></html>", "https://a.nl"), null);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
