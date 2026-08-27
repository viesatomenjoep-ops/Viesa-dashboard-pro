/**
 * Controleert of er geen halflege vellen in de klantdocumenten zitten.
 *
 * Draaien (met een draaiende `next start`):
 *   node scripts/check-pdf-vellen.mjs http://localhost:3000
 *
 * Waarom dit bestaat: een rapport waarin een onderdeel halverwege een vel
 * eindigt en het volgende eronder begint, leest als twee halve hoofdstukken.
 * Erger nog is een vel met alleen de staart van het vorige onderdeel — twee
 * regels op een verder leeg blad. Dat is precies wat een rapport goedkoop maakt,
 * en het is niet te zien in de code: je moet het afdrukken en kijken.
 *
 * Kijken doet dit script dus. Het rendert elk document als PDF, telt per vel
 * hoeveel pixels afwijken van wit, en slaat alarm onder de drempel. Dat is een
 * botte maat, maar precies bot genoeg: een vel met twee regels tekst komt niet
 * boven de 5%, en een normaal gevuld vel zit tussen de 15 en 70.
 *
 * Geen onderdeel van `npm test`: het heeft een draaiende server en een browser
 * nodig. Draai het na elke wijziging aan de afdrukopmaak.
 */
import { chromium } from "playwright";

/** Onder dit percentage inkt leest een vel als leeg. */
const DREMPEL = 8;

const basis = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const DOCUMENTEN = [
  { pad: "/rapport-voorbeeld", naam: "volledig rapport" },
  { pad: "/rapport-voorbeeld/kort", naam: "samenvatting" },
  { pad: "/rapport-voorbeeld/voorstel", naam: "voorstel" },
];

/** Het aantal vellen in een PDF, zonder er een bibliotheek voor te laden. */
function telVellen(buffer) {
  const t = buffer.toString("latin1");
  return t.split("/Type /Page").length - t.split("/Type /Pages").length;
}

const browser = await chromium.launch();
let mislukt = 0;

for (const doc of DOCUMENTEN) {
  const pagina = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await pagina.goto(basis + doc.pad, { waitUntil: "networkidle" });
  const pdf = await pagina.pdf({ format: "A4", printBackground: true });
  await pagina.close();

  const vellen = telVellen(pdf);
  const b64 = pdf.toString("base64");
  const metingen = [];

  for (let n = 1; n <= vellen; n++) {
    const kijker = await browser.newPage({ viewport: { width: 620, height: 877 } });
    await kijker.setContent(
      `<style>html,body{margin:0;height:100%}embed{width:100%;height:100%}</style>` +
        `<embed src="data:application/pdf;base64,${b64}#page=${n}&view=Fit&toolbar=0">`,
    );
    // De ingebouwde PDF-weergave heeft even nodig voordat het vel er staat.
    await kijker.waitForTimeout(2600);
    const beeld = "data:image/png;base64," + (await kijker.screenshot()).toString("base64");

    const meter = await browser.newPage();
    const inkt = await meter.evaluate(async (src) => {
      const im = new Image();
      await new Promise((klaar) => {
        im.onload = klaar;
        im.src = src;
      });
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let gekleurd = 0;
      for (let i = 0; i < px.length; i += 4) {
        // Alles wat merkbaar van wit afwijkt telt mee. De drempel op 242 en niet
        // op 255: de PDF-weergave zelf zet een lichte grijstint neer.
        if (px[i] < 242 || px[i + 1] < 242 || px[i + 2] < 242) gekleurd++;
      }
      return Math.round((gekleurd / (px.length / 4)) * 1000) / 10;
    }, beeld);

    metingen.push({ vel: n, inkt });
    await kijker.close();
    await meter.close();
  }

  const leeg = metingen.filter((m) => m.inkt < DREMPEL);
  console.log(`\n${doc.naam} — ${vellen} vellen`);
  console.log("  " + metingen.map((m) => `vel ${m.vel}: ${m.inkt}%`).join("   "));
  if (leeg.length > 0) {
    mislukt++;
    console.log(`  HALFLEEG: vel ${leeg.map((m) => m.vel).join(", ")} — onder ${DREMPEL}% inkt`);
  } else {
    console.log("  ok — geen halflege vellen");
  }
}

await browser.close();
console.log(mislukt === 0 ? "\nAlle documenten in orde.\n" : `\n${mislukt} document(en) met een halfleeg vel.\n`);
process.exit(mislukt === 0 ? 0 : 1);
