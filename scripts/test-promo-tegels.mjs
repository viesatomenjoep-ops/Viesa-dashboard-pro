/**
 * Tests voor lib/mail/promo-tegels.ts. Draaien: npm run test:promo-tegels
 *
 * Wat hier wordt bewaakt zijn de dingen die stil fout gaan en pas zichtbaar
 * worden in de inbox van een prospect:
 *
 *   - de scène moet stilstaand kloppen: alle beweging zit in het <style>-blok
 *     (dat Gmail en Outlook weggooien) en nooit als inline `animation`, en er
 *     is geen `position:absolute`, geen SVG, geen flexbox en geen rgba — de
 *     vier dingen waar Gmail of Outlook een mail op breken;
 *   - een bewerkte tekst met & of < mag de HTML niet openbreken, en een lege
 *     regel in de intro wordt een nieuwe alinea;
 *   - de dienstenselectie doet wat hij zegt, en een lege selectie betekent
 *     alles in plaats van een mail zonder tegels;
 *   - er is altijd een platte-tekstversie, en zonder agenda-link is de knop
 *     een mailto in plaats van dood.
 */
import { promoTegelsMail, standaardPromoVelden } from "../lib/mail/promo-tegels.ts";
import { DIENSTEN } from "../lib/aanbod.ts";

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

const basis = {
  ...standaardPromoVelden("Voorbeeld Webshop"),
  afspraakUrl: "https://cal.com/viesa/audit",
  whatsappUrl: "https://wa.me/31600000000?text=hoi",
  contactMail: "contact@viesa-automations.nl",
  logoUrl: "https://www.viesa-automations.nl/viesa-hex.png",
};

const vol = promoTegelsMail(basis);
/** Alleen de body: het <style>-blok mág animaties en media queries bevatten. */
const body = vol.html.slice(vol.html.indexOf("</head>"));

console.log("\nMailwetten — wat Gmail en Outlook slopen mag er niet in staan");
test("geen inline animation in de body", /style="[^"]*animation/.test(body), false);
test("geen position:absolute", body.includes("position:absolute"), false);
test("geen <svg>", body.includes("<svg"), false);
test("geen flexbox", body.includes("display:flex"), false);
test("geen grid", body.includes("display:grid"), false);
test("geen rgba (Outlook maakt er zwart van)", body.includes("rgba("), false);
test("geen css-variabelen", body.includes("var(--"), false);
test("beweging staat wel in het style-blok", vol.html.includes("@keyframes mGolf"), true);
test("alleen het logo als afbeelding", (body.match(/<img/g) ?? []).length, 1);

console.log("\nDe zes vignetten — elke dienst zijn eigen tafereel");
const inHtml = (naam) => vol.html.includes(naam.replace(/&/g, "&amp;"));
test("elke dienst heeft een tegel", DIENSTEN.every((d) => inHtml(d.naam)), true);
test("telefonie: het gesprek", vol.html.includes("LIVE GESPREK"), true);
test("chat: de bubbels", vol.html.includes("Ruilbon verstuurd"), true);
test("workflow: de systemen", ["SHOP", "ERP", "WMS", "CRM"].every((n) => vol.html.includes(n)), true);
test("mail: de opvolging", vol.html.includes("AUTOMATISCHE OPVOLGING"), true);
test("web: de adresbalk", vol.html.includes("uwdomein.nl"), true);
test("dashboard: de meters", vol.html.includes("UREN BESPAARD"), true);
test("de teller telt tot zes", vol.html.includes("01 / 06") && vol.html.includes("06 / 06"), true);

console.log("\nOp een telefoon — de tegels moeten onder elkaar vallen");
/* Gemeten met een echte browser valt de mail bij 320px binnen 305px en bij
   390px binnen 375px. Wat een test zonder browser wél kan bewaken zijn de twee
   dingen waardoor dat stukgaat: de media query die de kolommen laat stapelen,
   en een tabel die breder is dan de 600px-omhulling. */
test("er is een media query voor smalle schermen", vol.html.includes("@media only screen and (max-width:600px)"), true);
test("de kolommen stapelen daar", /\.kolom\s*\{[^}]*display:block/.test(vol.html), true);
test("de omhulling mag krimpen", /\.omhulsel\s*\{[^}]*max-width:100%/.test(vol.html), true);
const breed = (body.match(/width:(\d{3,})px/g) ?? [])
  .map((s) => Number(s.replace(/\D/g, "")))
  .filter((n) => n > 600);
test("niets is breder dan de 600px-omhulling", breed, []);

console.log("\nDe bewerkbare velden");
const eigen = promoTegelsMail({
  ...basis,
  onderwerp: "Even iets moois voor A & B <bv>",
  aanhef: "Ha Piet & Truus,",
  intro: "Eerste alinea.\n\nTweede alinea met <haakjes>.",
  slot: "Ik bel u dinsdag.",
});
test("onderwerp is het bewerkte onderwerp", eigen.onderwerp, "Even iets moois voor A & B <bv>");
test("& in de aanhef breekt de HTML niet", eigen.html.includes("Ha Piet &amp; Truus,"), true);
test("< in de intro breekt de HTML niet", eigen.html.includes("&lt;haakjes&gt;"), true);
test(
  "lege regel wordt een nieuwe alinea",
  /<p [^>]*>Eerste alinea\.<\/p>/.test(eigen.html) &&
    /<p [^>]*>Tweede alinea met &lt;haakjes&gt;\.<\/p>/.test(eigen.html),
  true,
);
test("de afsluiting staat erin", eigen.html.includes("Ik bel u dinsdag."), true);
test("de afsluiting staat ook in de tekstversie", eigen.tekst.includes("Ik bel u dinsdag."), true);

console.log("\nDe dienstenselectie");
const twee = promoTegelsMail({ ...basis, diensten: ["calling", "dashboard"] });
test("gekozen diensten staan erin", twee.html.includes("AI Calling Agents"), true);
test("niet-gekozen diensten niet", twee.html.includes("AI Chatbots"), false);
test("de teller telt de selectie", twee.html.includes("02 / 02"), true);
const leeg = promoTegelsMail({ ...basis, diensten: [] });
test(
  "lege selectie betekent alles, niet niets",
  DIENSTEN.every((d) => leeg.html.includes(d.naam.replace(/&/g, "&amp;"))),
  true,
);

console.log("\nKnoppen en terugvallen");
test("de afspraakknop wijst naar de agenda", vol.html.includes("https://cal.com/viesa/audit"), true);
test("de WhatsApp-knop staat erin", vol.html.includes("wa.me/31600000000"), true);
const zonder = promoTegelsMail({ ...basis, afspraakUrl: null, whatsappUrl: null });
test("zonder agenda wordt de knop een mailto", zonder.html.includes("mailto:contact@viesa-automations.nl?subject="), true);
test("zonder nummer geen WhatsApp-knop", zonder.html.includes("wa.me"), false);
test("er is altijd een tekstversie", vol.tekst.length > 200, true);
test("de tekstversie noemt de diensten", DIENSTEN.every((d) => vol.tekst.includes(d.naam)), true);

console.log("\nDe standaardvelden");
const std = standaardPromoVelden("Bakkerij Jansen");
test("de aanhef kent het bedrijf", std.aanhef, "Beste team van Bakkerij Jansen,");
test("het onderwerp kent het bedrijf", std.onderwerp.includes("Bakkerij Jansen"), true);
test("alle diensten staan standaard aan", std.diensten, DIENSTEN.map((d) => d.sleutel));
const anoniem = standaardPromoVelden(null);
test("zonder bedrijf wordt het Goedendag", anoniem.aanhef, "Goedendag,");

console.log(`\n${goed} ok, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
