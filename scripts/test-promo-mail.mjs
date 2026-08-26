/**
 * Tests voor lib/mail/promo-mail.ts. Draaien: npm run test:promo-mail
 *
 * Wat hier wordt bewaakt is niet de tekst maar de dingen die stil fout gaan en
 * pas zichtbaar worden in de inbox van een prospect:
 *
 *   - geen enkele stijl in een <style>-blok behalve de media query, want
 *     Gmail gooit de rest weg en dan valt de opmaak uit elkaar;
 *   - geen flexbox of grid, want Outlook op Windows rendert met Word;
 *   - een bedrijfsnaam met & of < mag de HTML niet openbreken;
 *   - er is altijd een platte-tekstversie;
 *   - zonder scan geen dood scanblok, en zonder agenda-link toch een werkende
 *     knop (dan een mailto).
 */
import { promotieMail } from "../lib/mail/promo-mail.ts";
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
  contactMail: "contact@viesa-automations.nl",
  logoUrl: "https://www.viesa-automations.nl/viesa-hex.png",
};

const kaal = promotieMail(basis);
const vol = promotieMail({
  ...basis,
  bedrijf: "Groenhof Tuin & Buiten",
  host: "groenhof.nl",
  rapportUrl: "https://x.nl/rapport/abc",
  korteUrl: "https://x.nl/rapport/abc/kort",
  score: 62,
  afspraakUrl: "https://cal.com/viesa/audit",
  whatsappUrl: "https://wa.me/31612345678",
});

console.log("\npromotieMail — wat overal moet werken");

// Gmail verwijdert <style>-blokken op sommige clients volledig. Alles wat de
// opmaak draagt moet dus inline staan; het enige wat in <style> mag is de
// media query voor smalle schermen, want die kán niet inline.
const stijlBlok = vol.html.match(/<style>([\s\S]*?)<\/style>/g) ?? [];
test("hoogstens twee style-blokken (mso-terugval en media query)", stijlBlok.length <= 2, true);
// De twee toegestane blokken zijn de media query (kan niet inline) en de
// Outlook-terugval voor het lettertype (moet in een conditioneel commentaar).
// Wat er níét in mag staan is opmaak die de indeling draagt: als Gmail het blok
// weggooit, moet de mail er nog steeds precies zo uitzien.
const opmaakInStyle = stijlBlok.filter((b) =>
  /(display|float|position|width\s*:\s*\d)/i.test(b.replace(/@media[^{]*\{[\s\S]*\}/g, "")),
);
test("geen indelingsopmaak in <style> buiten de media query", opmaakInStyle.length, 0);

// Outlook op Windows rendert met de opmaakmotor van Word: geen flexbox, geen
// grid. Eén display:flex en de hele mail schuift in elkaar.
test("geen flexbox", /display\s*:\s*flex/i.test(vol.html), false);
test("geen grid", /display\s*:\s*grid/i.test(vol.html), false);
test("geen SVG — Outlook toont die niet", /<svg/i.test(vol.html), false);

// Een mail zonder tekstversie scoort slechter bij spamfilters en is voor
// sommige lezers helemaal leeg.
test("er is een tekstversie", vol.tekst.length > 400, true);
test("de tekstversie noemt elke dienst", DIENSTEN.every((d) => vol.tekst.includes(d.naam)), true);

/** Zoals de naam in de HTML terechtkomt: ontsnapt, want "Websites & Apps". */
const alsHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

console.log("\npromotieMail — invoer die de HTML kan openbreken");

test(
  "een & in de bedrijfsnaam wordt ontsnapt",
  vol.html.includes("Groenhof Tuin &amp; Buiten"),
  true,
);
test(
  "een rauwe & uit de naam komt er niet in",
  vol.html.includes("Groenhof Tuin & Buiten"),
  false,
);

const stout = promotieMail({ ...basis, bedrijf: '<script>alert(1)</script>' });
test("html uit de bedrijfsnaam wordt geen echte tag", stout.html.includes("<script>alert"), false);
test("maar de naam blijft wel leesbaar", stout.html.includes("&lt;script&gt;"), true);

console.log("\npromotieMail — wat er wel en niet in hoort");

test("zonder scan geen scanblok", kaal.html.includes("Uw Deep Scan staat klaar"), false);
test("met scan wél een scanblok", vol.html.includes("Uw Deep Scan staat klaar"), true);
test("de score staat erin", vol.html.includes("62 van 100"), true);
test("de host staat erin", vol.html.includes("groenhof.nl"), true);

test("zonder WhatsApp geen WhatsApp-knop", kaal.html.includes("app ons direct"), false);
test("met WhatsApp wél", vol.html.includes("Of app ons direct"), true);

// Zonder agenda-link moet de knop nog steeds ergens heen: een mailtje.
test("zonder agenda valt de knop terug op mailto", kaal.html.includes("mailto:contact@viesa-automations.nl?subject="), true);
test("met agenda wijst de knop daarheen", vol.html.includes("https://cal.com/viesa/audit"), true);

test("het logo heeft een absolute URL", vol.html.includes("https://www.viesa-automations.nl/viesa-hex.png"), true);
test("het logo heeft een alt-tekst", /<img[^>]+alt="Viesa"/.test(vol.html), true);

test(
  "alle zes diensten staan erin",
  DIENSTEN.every((d) => vol.html.includes(alsHtml(d.naam))),
  true,
);

// Een onderwerp zonder naam mag niet "undefined" of ": " bevatten.
test("onderwerp zonder bedrijf", kaal.onderwerp, "Waar automatisering bij u het meeste oplevert");
test(
  "onderwerp met bedrijf",
  vol.onderwerp,
  "Groenhof Tuin & Buiten: waar automatisering bij u het meeste oplevert",
);
test("aanhef zonder bedrijf is neutraal", kaal.html.includes("Goedendag,"), true);

// De voorregel is wat Gmail naast het onderwerp toont. Ontbreekt hij, dan pakt
// Gmail de eerste woorden uit de HTML — meestal iets zinloos.
test("er is een verborgen voorregel", vol.html.includes("max-height:0;overflow:hidden"), true);

console.log(`\n${goed} goed, ${fout} fout\n`);
process.exit(fout === 0 ? 0 : 1);
