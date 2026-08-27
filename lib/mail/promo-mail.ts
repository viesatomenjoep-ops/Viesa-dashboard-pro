import { DIENSTEN, PIJLERS, REVIEW, KERNBELOFTE, AUDIT_BELOFTE } from "@/lib/aanbod";

/**
 * De promotiemail van Viesa: wat we doen, wat het oplevert, en één knop om een
 * gratis audit in te plannen.
 *
 * Waarom dit geen React-component is en geen mooie CSS gebruikt: e-mail is geen
 * webpagina. Gmail strippen `<link>` en `@font-face` (staat al als geleerde les
 * in CLAUDE.md), Outlook op Windows rendert met de opmaakmotor van Word en kent
 * geen flexbox, geen grid, geen `border-radius` op alles, en geen SVG. Wat
 * overal werkt is wat hier staat: geneste tabellen, inline stijlen, en
 * font-stacks met een veilige terugval.
 *
 * De "graphics" zijn daarom geen afbeeldingen maar gekleurde tabelcellen. Dat
 * heeft een tweede voordeel: de meeste mailprogramma's blokkeren externe
 * afbeeldingen tot de lezer op "afbeeldingen weergeven" klikt. Een mail die
 * voor zijn opmaak op plaatjes leunt, ziet er bij eerste opening dus kapot uit.
 * Deze niet — alleen het logo is een afbeelding, en die heeft een alt-tekst.
 *
 * Puur, dus testbaar zonder netwerk of database. Zie scripts/test-promo-mail.mjs.
 */

/** De huisstijlkleuren, hier als losse waarden — CSS-variabelen kent e-mail niet. */
const K = {
  navy: "#19445B",
  diepnavy: "#111D36",
  accent: "#1E9E93",
  accentDonker: "#146E67",
  zand: "#F3F0E9",
  zanddiep: "#EEEBE2",
  lijn: "#E4E1D8",
  wit: "#FFFFFF",
  tekst: "#1B2B3A",
  gedempt: "#5A6B7B",
  zacht: "#8494A3",
  /* Een vaste kleur in plaats van rgba: Outlook kent geen doorzichtigheid en
     rendert zo'n vlak dan gewoon zwart. */
  navyLicht: "#1B2740",
  lichtblauw: "#B9C2D4",
} as const;

/**
 * Font-stacks met een terugval die op elk apparaat bestaat. Archivo staat wel
 * vooraan — wie 'm heeft ziet de echte huisstijl, de rest ziet een schreefloze
 * die er dichtbij zit. Een webfont laden heeft in e-mail geen zin.
 */
const LETTER = "Archivo, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type PromoMailInvoer = {
  /** De bedrijfsnaam van de ontvanger, voor de aanhef en de eerste alinea. */
  bedrijf?: string | null;
  /** De site van de ontvanger — alleen gebruikt als er een scan bij zit. */
  host?: string | null;
  /** Het volledige Deep Scan-rapport, als dat er is. */
  rapportUrl?: string | null;
  /** De samenvatting van één pagina, als die er is. */
  korteUrl?: string | null;
  /** De score uit de scan, om het scanblok concreet te maken. */
  score?: number | null;
  /** Waar de ontvanger zelf een moment kiest. Leeg = de knop wordt een mailtje. */
  afspraakUrl?: string | null;
  /** wa.me-link. Leeg = geen WhatsApp-regel. */
  whatsappUrl?: string | null;
  /** Ons mailadres, voor de voettekst en de terugval-knop. */
  contactMail: string;
  /** De volledige https-URL van het logo. Relatieve paden werken niet in mail. */
  logoUrl: string;
};

export type PromoMail = {
  onderwerp: string;
  /** De volledige HTML-mail, klaar om te versturen. */
  html: string;
  /** De platte-tekstvariant, voor lezers en filters die geen HTML tonen. */
  tekst: string;
};

/** Maakt tekst veilig voor HTML. Bedrijfsnamen bevatten & en ' vaker dan je denkt. */
function veilig(t: string): string {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Eén dienstkaart als tabelcel. */
function dienstKaart(d: (typeof DIENSTEN)[number], nummer: number): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background:${K.wit};border:1px solid ${K.lijn};border-radius:10px;">
  <tr>
    <td style="padding:0;">
      <!-- De gekleurde kaplijn: in plaats van een icoon, dat toch geblokkeerd wordt. -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${K.accent};border-radius:10px 10px 0 0;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 18px 18px 18px;font-family:${LETTER};">
      <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${K.accentDonker};font-weight:700;">
        ${String(nummer).padStart(2, "0")} &middot; ${veilig(d.categorie)}
      </p>
      <p style="margin:0 0 8px 0;font-size:17px;line-height:1.25;font-weight:700;color:${K.tekst};">
        ${veilig(d.naam)}
      </p>
      <p style="margin:0 0 10px 0;font-size:14px;line-height:1.55;color:${K.gedempt};">
        ${veilig(d.belofte)}
      </p>
      <p style="margin:0;padding-top:10px;border-top:1px solid ${K.lijn};font-size:13px;line-height:1.5;color:${K.tekst};">
        <span style="color:${K.accentDonker};font-weight:700;">Levert op:</span> ${veilig(d.opbrengst)}
      </p>
    </td>
  </tr>
</table>`;
}

/** Twee kaarten naast elkaar; op smalle schermen vallen ze onder elkaar. */
function dienstRij(links: string, rechts: string | null): string {
  return `
<tr>
  <td style="padding:0 0 12px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td class="kolom" width="50%" valign="top" style="padding-right:6px;">${links}</td>
        <td class="kolom" width="50%" valign="top" style="padding-left:6px;">${rechts ?? "&nbsp;"}</td>
      </tr>
    </table>
  </td>
</tr>`;
}

/** Eén pijler als regel met een gekleurd blokje ervoor. */
function pijlerRegel(p: (typeof PIJLERS)[number]): string {
  return `
<tr>
  <td style="padding:0 0 14px 0;font-family:${LETTER};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="10" valign="top" style="padding-top:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td width="8" height="8" style="width:8px;height:8px;font-size:0;line-height:0;background:${K.accent};border-radius:8px;">&nbsp;</td></tr>
          </table>
        </td>
        <td style="padding-left:12px;">
          <p style="margin:0 0 3px 0;font-size:15px;font-weight:700;color:${K.zand};">${veilig(p.naam)}</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:${K.lichtblauw};">${veilig(p.uitleg)}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

/** Een knop die ook in Outlook een knop blijft: een tabelcel, geen <a> met padding. */
function knop(
  label: string,
  href: string,
  vulling: string,
  tekstkleur: string,
  /** Alleen nodig voor een lichte knop op een licht vlak. */
  rand?: string,
): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
  <tr>
    <td align="center" style="background:${vulling};border-radius:999px;${rand ? `border:1px solid ${rand};` : ""}">
      <a href="${veilig(href)}" style="display:inline-block;padding:14px 30px;font-family:${LETTER};font-size:15px;font-weight:700;color:${tekstkleur};text-decoration:none;border-radius:999px;">${veilig(label)}</a>
    </td>
  </tr>
</table>`;
}

export function promotieMail(invoer: PromoMailInvoer): PromoMail {
  const {
    bedrijf,
    host,
    rapportUrl,
    korteUrl,
    score,
    afspraakUrl,
    whatsappUrl,
    contactMail,
    logoUrl,
  } = invoer;

  const naam = bedrijf?.trim() || null;
  const aanhef = naam ? `Beste team van ${naam},` : "Goedendag,";

  const afspraakHref = afspraakUrl?.trim()
    ? afspraakUrl.trim()
    : `mailto:${contactMail}?subject=${encodeURIComponent("Graag een gratis AI- en automatiseringsaudit")}`;

  const onderwerp = naam
    ? `${naam}: waar automatisering bij u het meeste oplevert`
    : "Waar automatisering bij u het meeste oplevert";

  // De regel die in de inbox naast het onderwerp staat. Zonder deze regel toont
  // Gmail de eerste woorden van de HTML — meestal iets zinloos.
  const voorregel = naam
    ? `Een gratis audit voor ${naam}: AI-agents, workflows en automatisering, met een concreet plan.`
    : "Een gratis audit: AI-agents, workflows en automatisering, met een concreet plan.";

  const scanBlok =
    rapportUrl || korteUrl
      ? `
<tr>
  <td style="padding:0 0 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background:${K.zanddiep};border:1px solid ${K.lijn};border-radius:12px;">
      <tr>
        <td style="padding:22px 24px;font-family:${LETTER};">
          <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${K.accentDonker};font-weight:700;">
            We keken alvast mee
          </p>
          <p style="margin:0 0 10px 0;font-size:19px;line-height:1.25;font-weight:700;color:${K.tekst};">
            Uw Deep Scan staat klaar${host ? ` voor ${veilig(host)}` : ""}
          </p>
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${K.gedempt};">
            ${
              typeof score === "number"
                ? `Zeven onderdelen gemeten, elk met zijn eigen norm. Het totaal kwam uit op <strong style="color:${K.tekst};">${score} van 100</strong> — in het rapport staat per onderdeel wat daarachter zit.`
                : "Zeven onderdelen gemeten, elk met zijn eigen norm. In het rapport staat per onderdeel wat er goed staat en waar te winnen valt."
            }
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${
                korteUrl
                  ? `<td style="padding-right:10px;">${knop("Samenvatting (1 pagina)", korteUrl, K.navy, K.zand)}</td>`
                  : ""
              }
              ${
                rapportUrl
                  ? `<td>${knop("Volledig rapport", rapportUrl, K.wit, K.navy, K.lijn)}</td>`
                  : ""
              }
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`
      : "";

  const rijen: string[] = [];
  for (let i = 0; i < DIENSTEN.length; i += 2) {
    rijen.push(
      dienstRij(
        dienstKaart(DIENSTEN[i], i + 1),
        DIENSTEN[i + 1] ? dienstKaart(DIENSTEN[i + 1], i + 2) : null,
      ),
    );
  }

  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${veilig(onderwerp)}</title>
<!--[if mso]>
<style>body,table,td,a{font-family:Segoe UI,Arial,sans-serif !important}</style>
<![endif]-->
<style>
  /* Het enige stukje <style> dat we gebruiken: alleen voor de smalle weergave.
     Gmail op mobiel houdt media queries wel; Outlook negeert ze, en die toont
     de brede versie — die past daar toch. */
  @media only screen and (max-width:600px) {
    .kolom { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
    .omhulsel { width:100% !important; max-width:100% !important; }
    .rand { padding-left:18px !important; padding-right:18px !important; }
    .groot { font-size:26px !important; line-height:1.15 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${K.zand};">
<!-- De regel die in de inbox naast het onderwerp verschijnt. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${veilig(voorregel)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${K.zand};">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="omhulsel" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">

  <!-- Briefhoofd -->
  <tr>
    <td class="rand" style="background:${K.navy};padding:26px 32px 30px 32px;font-family:${LETTER};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- Het beeldmerk staat op een zandkleurig tegeltje, en dat is geen
               versiering: het logo is een navy hexagon met een witte V. Recht op
               het navy briefhoofd valt die hexagon weg en blijft er een zwevende
               V over die niemand als logo herkent. Op zand leest hij zoals hij
               bedoeld is.

               Het tegeltje doet nog iets: de meeste mailprogramma's blokkeren
               afbeeldingen bij de eerste opening, en dan staat er een net
               zandkleurig vlakje in plaats van een gebroken-plaatje-icoon.
               Vandaar ook alt="" — de naam staat er in tekst naast. -->
          <td width="38" valign="middle">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="38" height="38" align="center" valign="middle"
                    style="width:38px;height:38px;background:${K.zand};border-radius:9px;">
                  <img src="${veilig(logoUrl)}" width="26" height="26" alt="" style="display:block;width:26px;height:26px;border:0;">
                </td>
              </tr>
            </table>
          </td>
          <td valign="middle" style="padding-left:10px;font-size:15px;font-weight:800;letter-spacing:1.2px;color:${K.zand};">
            VIESA <span style="font-weight:400;color:${K.lichtblauw};">AUTOMATIONS</span>
          </td>
        </tr>
      </table>

      <p class="groot" style="margin:26px 0 12px 0;font-size:30px;line-height:1.12;font-weight:800;color:${K.zand};letter-spacing:-0.5px;">
        ${veilig(KERNBELOFTE)}
      </p>
      <p style="margin:0;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:${K.accent};font-weight:700;">
        AI-agents &middot; Telefonie &middot; Chat &middot; E-mail &middot; Workflows &middot; Dashboards
      </p>
    </td>
  </tr>

  <!-- Voorwoord -->
  <tr>
    <td class="rand" style="background:${K.wit};padding:30px 32px 4px 32px;font-family:${LETTER};">
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${K.tekst};">${veilig(aanhef)}</p>
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${K.gedempt};">
        In vrijwel elk bedrijf zit werk dat elke week terugkomt en dat niemand
        leuk vindt: dezelfde vragen beantwoorden, gegevens overtypen tussen twee
        systemen, achter offertes aanbellen. Dat werk kan weg — niet door harder
        te werken, maar door het aan een agent over te laten die het foutloos en
        zonder klagen doet.
      </p>
      <p style="margin:0 0 22px 0;font-size:15px;line-height:1.65;color:${K.gedempt};">
        Wij bouwen die agents en de koppelingen eromheen. Hieronder staat wat we
        doen; onderaan staat hoe u er binnen een paar dagen achter komt wat het
        bij u zou opleveren.
      </p>
    </td>
  </tr>

  <!-- Aanbod -->
  <tr>
    <td class="rand" style="background:${K.wit};padding:0 32px 8px 32px;font-family:${LETTER};">
      <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${K.accentDonker};font-weight:700;">
        Zes pijlers, één aanspreekpunt
      </p>
      <p style="margin:0 0 18px 0;font-size:22px;line-height:1.2;font-weight:800;color:${K.tekst};">
        Wat wij voor u kunnen bouwen
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${rijen.join("")}
      </table>
    </td>
  </tr>

  <!-- Deep Scan, als die er is -->
  <tr>
    <td class="rand" style="background:${K.wit};padding:20px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${scanBlok}
      </table>
    </td>
  </tr>

  <!-- Waarom Viesa -->
  <tr>
    <td class="rand" style="background:${K.diepnavy};padding:30px 32px;font-family:${LETTER};">
      <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${K.accent};font-weight:700;">
        Waarom Viesa
      </p>
      <p style="margin:0 0 20px 0;font-size:22px;line-height:1.2;font-weight:800;color:${K.zand};">
        Waarom bedrijven voor ons kiezen
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${PIJLERS.map(pijlerRegel).join("")}
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
        <tr>
          <td style="padding:18px 20px;background:${K.navyLicht};border-left:3px solid ${K.accent};border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px 0;font-size:14px;letter-spacing:2px;color:#F5BE4F;">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
            <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:${K.zand};font-style:italic;">
              &ldquo;${veilig(REVIEW.tekst)}&rdquo;
            </p>
            <p style="margin:0;font-size:12px;color:${K.lichtblauw};">${veilig(REVIEW.bron)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- De vraag -->
  <tr>
    <td class="rand" style="background:${K.navy};padding:34px 32px;font-family:${LETTER};">
      <p style="margin:0 0 10px 0;font-size:24px;line-height:1.2;font-weight:800;color:${K.zand};">
        Klaar om uw bedrijf te automatiseren?
      </p>
      <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:${K.lichtblauw};">
        ${veilig(AUDIT_BELOFTE)}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:10px;">${knop("Plan een gratis audit", afspraakHref, K.accent, "#062B28")}</td>
          ${whatsappUrl ? `<td>${knop("Of app ons direct", whatsappUrl, "#25D366", "#06301A")}</td>` : ""}
        </tr>
      </table>
      <p style="margin:18px 0 0 0;font-size:13px;color:${K.lichtblauw};">
        Liever mailen? <a href="mailto:${veilig(contactMail)}" style="color:${K.zand};">${veilig(contactMail)}</a>
      </p>
    </td>
  </tr>

  <!-- Voettekst -->
  <tr>
    <td class="rand" style="background:${K.diepnavy};padding:22px 32px;font-family:${LETTER};">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#7D8CA6;">
        Viesa Automations &middot; Breda &middot;
        <a href="mailto:${veilig(contactMail)}" style="color:#7D8CA6;">${veilig(contactMail)}</a><br>
        U ontvangt deze mail omdat wij denken dat automatisering bij u iets oplevert.
        Liever niets meer van ons horen? Eén antwoord met &ldquo;stop&rdquo; is genoeg.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // De platte-tekstvariant. Niet optioneel: een mail zonder tekstversie scoort
  // slechter bij spamfilters, en sommige lezers tonen alleen dit.
  const tekst = [
    aanhef,
    "",
    KERNBELOFTE,
    "",
    "In vrijwel elk bedrijf zit werk dat elke week terugkomt en dat niemand leuk vindt:",
    "dezelfde vragen beantwoorden, gegevens overtypen tussen twee systemen, achter",
    "offertes aanbellen. Dat werk kan weg.",
    "",
    "WAT WIJ BOUWEN",
    ...DIENSTEN.map((d) => `- ${d.naam}: ${d.belofte} Levert op: ${d.opbrengst}`),
    "",
    "WAAROM VIESA",
    ...PIJLERS.map((p) => `- ${p.naam}: ${p.uitleg}`),
    "",
    ...(rapportUrl || korteUrl
      ? [
          `UW DEEP SCAN${host ? ` — ${host}` : ""}`,
          typeof score === "number" ? `Totaal: ${score} van 100.` : "",
          korteUrl ? `Samenvatting: ${korteUrl}` : "",
          rapportUrl ? `Volledig rapport: ${rapportUrl}` : "",
          "",
        ].filter(Boolean)
      : []),
    AUDIT_BELOFTE,
    `Plan een gratis audit: ${afspraakHref}`,
    ...(whatsappUrl ? [`WhatsApp: ${whatsappUrl}`] : []),
    `Mail: ${contactMail}`,
    "",
    "Viesa Automations · Breda",
    'Liever niets meer van ons horen? Eén antwoord met "stop" is genoeg.',
  ].join("\n");

  return { onderwerp, html, tekst };
}
