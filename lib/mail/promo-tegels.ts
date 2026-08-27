import { DIENSTEN, PIJLERS, REVIEW, AUDIT_BELOFTE } from "@/lib/aanbod";

/**
 * De tegelmail: het Viesa-aanbod als de dienstentegels van de landingspagina,
 * zonder rapportblok, en met tekst die je vóór het versturen zelf bijwerkt.
 *
 * Dit is bewust een tweede sjabloon naast `promo-mail.ts` en geen variant
 * ervan. Die mail hoort bij een Deep Scan en praat over het rapport; deze mail
 * ís de landingspagina, in het klein: dezelfde tegels, dezelfde mono-letter,
 * hetzelfde accent. Een prospect die na deze mail de site opent moet denken
 * "dit ken ik al" — dat is het hele idee, en het is dezelfde reden waarom de
 * teksten in `lib/aanbod.ts` letterlijk van de landingspagina komen.
 *
 * Daarom wijkt het accent hier af van het dashboard-teal: de landingspagina
 * gebruikt `#E2603F`, dus deze mail ook. Het dashboard is voor ons; deze mail
 * staat naast de site van de prospect.
 *
 * Over de "geanimeerde graphics": e-mail kan dat maar half, en dat is hier zo
 * opgelost dat niemand het merkt. Elke tegel heeft een vignet — een golfvorm
 * voor telefonie, chatbubbels, koppelnodes, een ladende site, KPI-meters, een
 * afvinklijst — dat als stilstaand tafereel klopt, gebouwd uit tabellen en
 * inline stijlen. De beweging zit uitsluitend in klassen in het <style>-blok:
 * Apple Mail en iOS Mail (het gros van de zakelijke telefoon-opens) spelen die
 * af, Gmail en Outlook gooien ze weg en tonen het stilstaande tafereel. Nooit
 * andersom bouwen: een scène die pas klopt als hij beweegt, is in Gmail kapot.
 *
 * Verder gelden alle mailwetten uit `promo-mail.ts`: geneste tabellen, geen
 * flexbox, geen SVG (Gmail stript het), geen `position:absolute` (idem), geen
 * rgba (Outlook maakt er zwart van), en alleen het logo als afbeelding.
 *
 * Puur, dus testbaar zonder netwerk of database. Zie scripts/test-promo-tegels.mjs.
 */

/** Het palet van de landingspagina — vaste hexwaarden, want rgba en var() overleven e-mail niet. */
const K = {
  navy: "#19445B",
  diepnavy: "#111D36",
  accent: "#E2603F",
  zand: "#F3F0E9",
  vignet: "#F7F5EF",
  lijn: "#E4E1D8",
  lijnZacht: "#EEEBE2",
  wit: "#FFFFFF",
  tekst: "#111D36",
  gedempt: "#55617A",
  mono: "#8A8FA0",
  teller: "#C9C4B4",
  /* Vervangers voor de rgba-tinten van de landingspagina, uitgerekend op hun
     ondergrond. Outlook rendert rgba als zwart, dus die mag hier niet in. */
  spoor: "#E6E3D9" /* rgba(17,29,54,.08) op #F7F5EF */,
  skelet: "#DCD9CE" /* rgba(17,29,54,.16) op #F7F5EF */,
  golf: "#C6CEDA" /* de gedempte waveform-balkjes */,
  accentVlak: "#F9E3DA" /* rgba(226,96,63,.13) op #F7F5EF */,
  accentRand: "#EDAE97" /* rgba(226,96,63,.4) op #F7F5EF */,
  navyLicht: "#1B2740",
  lichtblauw: "#B9C2D4",
} as const;

const LETTER = "Archivo, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
/* Courier New als terugval: die staat op elk apparaat, en een mono-terugval
   die stiekem een schreefloze is sloopt precies het landing-page-gevoel. */
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

/**
 * De velden die je in het verzendvenster zelf bewerkt. Alles wat hier staat is
 * tekst van de afzender; alles wat er níét staat (tegels, knoppen, voettekst)
 * ligt vast in dit bestand.
 */
export type PromoVelden = {
  onderwerp: string;
  aanhef: string;
  /** Alinea's, gescheiden door een lege regel. */
  intro: string;
  /** Persoonlijke afsluiting boven de knoppen. Leeg = weglaten. */
  slot: string;
  /** Welke diensten als tegel meegaan, op sleutel. Volgorde is die van DIENSTEN. */
  diensten: string[];
};

/** De standaardtekst waarmee het venster opent — een vertrekpunt, geen dwang. */
export function standaardPromoVelden(bedrijf?: string | null): PromoVelden {
  const naam = bedrijf?.trim() || null;
  return {
    onderwerp: naam
      ? `Wat slimme automatisering ${naam} oplevert`
      : "Wat slimme automatisering u oplevert",
    aanhef: naam ? `Beste team van ${naam},` : "Goedendag,",
    intro: [
      "In vrijwel elk bedrijf zit werk dat elke week terugkomt: dezelfde vragen aan de telefoon, gegevens overtypen tussen twee systemen, achter offertes aan bellen. Dat werk kan een AI-agent overnemen — foutloos, en zonder er ooit genoeg van te krijgen.",
      "Hieronder ziet u wat we bouwen. Alles koppelt aan de systemen die u al gebruikt, en alles wordt gebouwd met één doel: meetbaar minder handwerk.",
    ].join("\n\n"),
    slot: "",
    diensten: DIENSTEN.map((d) => d.sleutel),
  };
}

export type PromoTegelsInvoer = PromoVelden & {
  /** Waar de ontvanger zelf een moment kiest. Leeg = de knop wordt een mailtje. */
  afspraakUrl?: string | null;
  /** wa.me-link. Leeg = geen WhatsApp-knop. */
  whatsappUrl?: string | null;
  contactMail: string;
  /** De volledige https-URL van het logo. Relatieve paden werken niet in mail. */
  logoUrl: string;
};

export type PromoTegelsMail = {
  onderwerp: string;
  html: string;
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

/** Vrije tekst → alinea's. Lege regel = nieuwe alinea, enkele regel = <br>. */
function alineas(tekst: string, stijl: string): string {
  return tekst
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => `<p style="${stijl}">${veilig(a).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Een mono-label zoals op de landingspagina: klein, gespatieerd, kapitaal. */
function monoLabel(tekstIn: string, kleur: string, grootte = 8.5): string {
  return `<span style="font-family:${MONO};font-size:${grootte}px;letter-spacing:1.4px;color:${kleur};">${tekstIn}</span>`;
}

/* ---------------------------------------------------------------------------
 * De vignetten: per dienst één klein tafereel, gebouwd uit tabellen.
 * Elk vignet moet stilstaand kloppen — de klassen (m-…) doen alleen beweging.
 * ------------------------------------------------------------------------- */

/** Telefonie: een live gesprek — golfvorm met een terminalregel eronder. */
function vignetCalling(): string {
  const hoogtes = [10, 17, 12, 22, 30, 20, 34, 25, 42, 32, 37, 27, 32, 20, 15, 10];
  const balken = hoogtes
    .map((h, i) => {
      const accent = i >= 7 && i <= 11;
      return `<td width="6" align="center" valign="middle" style="width:6px;padding:0 1px;"><div class="m-golf mg${(i % 8) + 1}" style="width:4px;height:${h}px;border-radius:2px;background:${accent ? K.accent : K.golf};font-size:0;line-height:0;">&nbsp;</div></td>`;
    })
    .join("");
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td align="left">
    <span class="m-stip" style="display:inline-block;width:6px;height:6px;border-radius:6px;background:${K.accent};font-size:0;line-height:0;">&nbsp;</span>
    &nbsp;${monoLabel("LIVE GESPREK", K.gedempt)}
  </td></tr>
  <tr><td align="center" style="padding:13px 0 12px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${balken}</tr></table>
  </td></tr>
  <tr><td align="left">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:${K.wit};border:1px solid ${K.lijn};border-radius:7px;padding:5px 9px;font-family:${MONO};font-size:8.5px;color:${K.gedempt};">&rarr; order #40812 opgezocht in WMS</td>
    </tr></table>
  </td></tr>
</table>`;
}

/** Klantenservice: drie chatbubbels die (waar het kan) één voor één binnenkomen. */
function vignetChat(): string {
  const bubbel = (
    klas: string,
    uitlijning: "left" | "right",
    stijl: string,
    inhoud: string,
    laatste = false,
  ) => `
  <tr><td align="${uitlijning}" style="padding:0 0 ${laatste ? 0 : 6}px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="${klas}" style="${stijl};padding:5px 9px;font-family:${LETTER};font-size:10.5px;line-height:1.4;">${inhoud}</td>
    </tr></table>
  </td></tr>`;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  ${bubbel("m-chat mc1", "right", `background:${K.navy};color:${K.zand};border-radius:10px 10px 3px 10px`, "Kan ik mijn maat nog ruilen?")}
  ${bubbel("m-chat mc2", "left", `background:${K.wit};border:1px solid ${K.lijn};color:${K.tekst};border-radius:10px 10px 10px 3px`, "Zeker, ik regel het direct.")}
  ${bubbel("m-chat mc3", "left", `background:${K.accentVlak};border:1px solid ${K.accentRand};color:${K.tekst};border-radius:10px 10px 10px 3px`, "Ruilbon verstuurd &#10003;", true)}
  <tr><td align="left" style="padding-top:9px;">${monoLabel("VIESA ASSIST", K.mono)}<span class="m-caret" style="display:inline-block;width:4px;height:8px;background:${K.teller};font-size:0;line-height:0;vertical-align:-1px;margin-left:4px;">&nbsp;</span></td></tr>
</table>`;
}

/** Integraties: vier systemen aan één lijn, met datapunten die oplichten. */
function vignetWorkflow(): string {
  const node = (naam: string) =>
    `<td style="background:${K.wit};border:1px solid ${K.lijn};border-radius:8px;padding:6px 8px;font-family:${MONO};font-size:8px;letter-spacing:1px;color:${K.tekst};">${naam}</td>`;
  const koppel = (klas: string) => `
    <td width="24" align="center" valign="middle" style="width:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="7" style="width:7px;"><div style="width:7px;height:2px;background:${K.skelet};font-size:0;line-height:0;">&nbsp;</div></td>
        <td width="6" align="center" style="width:6px;padding:0 1px;"><div class="m-punt ${klas}" style="width:5px;height:5px;border-radius:5px;background:${K.accent};font-size:0;line-height:0;">&nbsp;</div></td>
        <td width="7" style="width:7px;"><div style="width:7px;height:2px;background:${K.skelet};font-size:0;line-height:0;">&nbsp;</div></td>
      </tr></table>
    </td>`;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td align="right" style="padding:0 0 12px 0;">${monoLabel("REALTIME SYNC", K.mono)}</td></tr>
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      ${node("SHOP")}${koppel("mp1")}${node("ERP")}${koppel("mp2")}${node("WMS")}${koppel("mp3")}${node("CRM")}
    </tr></table>
  </td></tr>
  <tr><td align="center" style="padding-top:14px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border:1px solid ${K.accentRand};background:${K.wit};border-radius:999px;padding:4px 12px;font-family:${MONO};font-size:8px;letter-spacing:1.4px;color:${K.accent};"><span class="m-draai" style="display:inline-block;">&#8635;</span>&nbsp; VIESA KOPPELT &middot; 24/7</td>
    </tr></table>
  </td></tr>
</table>`;
}

/** E-mail: de opvolging die zichzelf afvinkt. */
function vignetMailAuto(): string {
  const regel = (klas: string, tekstIn: string, open = false, laatste = false) => `
  <tr>
    <td width="16" valign="middle" style="width:16px;padding:0 0 ${laatste ? 0 : 8}px 0;">
      ${
        open
          ? `<div style="width:13px;height:13px;border:1px solid ${K.teller};border-radius:4px;font-size:0;line-height:0;">&nbsp;</div>`
          : `<div class="m-tik ${klas}" style="width:14px;height:14px;border-radius:4px;background:${K.accent};color:${K.wit};font-size:9px;line-height:14px;font-weight:800;text-align:center;font-family:${LETTER};">&#10003;</div>`
      }
    </td>
    <td valign="middle" style="padding:0 0 ${laatste ? 0 : 8}px 9px;font-family:${LETTER};font-size:11px;font-weight:600;color:${open ? K.mono : K.tekst};">${tekstIn}</td>
  </tr>`;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td colspan="2" align="right" style="padding:0 0 10px 0;">${monoLabel("AUTOMATISCHE OPVOLGING", K.mono)}</td></tr>
  ${regel("mt1", "Offerte verstuurd")}
  ${regel("mt2", "Herinnering gepland &middot; dag 3")}
  ${regel("mt3", "Opvolging verzonden")}
  ${regel("", "Antwoord ontvangen &rarr; naar u", true, true)}
</table>`;
}

/** Digitaal: een site die laadt — adresbalk, skeletregels, twee knoppen. */
function vignetWeb(): string {
  const skelet = (breedte: number, klas: string) =>
    `<tr><td colspan="2" style="padding:0 0 7px 0;"><div class="m-skel ${klas}" style="width:${breedte}%;height:7px;border-radius:4px;background:${K.skelet};font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td width="86" style="width:86px;padding:0 0 11px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:${K.wit};border:1px solid ${K.lijn};border-radius:999px;padding:3px 10px;font-family:${MONO};font-size:8.5px;color:${K.mono};">uwdomein.nl</td>
      </tr></table>
    </td>
    <td valign="middle" style="padding:0 0 11px 10px;">
      <div style="height:2px;border-radius:1px;background:${K.spoor};font-size:0;line-height:0;"><div class="m-laad" style="width:62%;height:2px;border-radius:1px;background:${K.accent};font-size:0;line-height:0;">&nbsp;</div></div>
    </td>
  </tr>
  ${skelet(58, "ms1")}
  ${skelet(82, "ms2")}
  ${skelet(70, "ms3")}
  <tr><td colspan="2" style="padding-top:4px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:52px;"><div style="width:52px;height:18px;border-radius:5px;background:${K.accent};font-size:0;line-height:0;">&nbsp;</div></td>
      <td style="padding-left:7px;"><div style="width:42px;height:16px;border-radius:5px;border:1px solid ${K.teller};background:${K.wit};font-size:0;line-height:0;">&nbsp;</div></td>
    </tr></table>
  </td></tr>
</table>`;
}

/** Inzicht: twee KPI-meters en een staafgrafiekje dat live bijhoudt. */
function vignetDashboard(): string {
  const meter = (label: string, breedte: number, kleur: string, waarde: string, klas: string) => `
  <tr>
    <td width="78" style="width:78px;padding:0 0 10px 0;">${monoLabel(label, K.mono, 8)}</td>
    <td valign="middle" style="padding:0 8px 10px 8px;">
      <div style="height:6px;border-radius:3px;background:${K.spoor};font-size:0;line-height:0;"><div class="m-vul ${klas}" style="width:${breedte}%;height:6px;border-radius:3px;background:${kleur};font-size:0;line-height:0;">&nbsp;</div></div>
    </td>
    <td width="34" align="right" style="width:34px;padding:0 0 10px 0;font-family:${LETTER};font-size:11.5px;font-weight:700;color:${K.tekst};">${waarde}</td>
  </tr>`;
  const staven = [8, 13, 10, 16, 14, 20, 17, 24, 21, 28, 26, 32]
    .map(
      (h, i) =>
        `<td width="11" align="center" valign="bottom" style="width:11px;padding:0 1px;"><div class="m-groei mb${(i % 6) + 1}" style="width:8px;height:${h}px;border-radius:2px 2px 0 0;background:${i >= 8 ? K.accent : K.golf};font-size:0;line-height:0;">&nbsp;</div></td>`,
    )
    .join("");
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  ${meter("ORDERS", 78, K.navy, "1.284", "mv1")}
  ${meter("UREN BESPAARD", 64, K.accent, "312", "mv2")}
  <tr><td colspan="3" style="padding-top:2px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td valign="bottom"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${staven}</tr></table></td>
      <td align="right" valign="bottom"><span class="m-stip" style="display:inline-block;width:5px;height:5px;border-radius:5px;background:${K.accent};font-size:0;line-height:0;">&nbsp;</span>&nbsp;${monoLabel("LIVE", K.accent, 8)}</td>
    </tr></table>
  </td></tr>
</table>`;
}

/** De vignetten op dienstsleutel. Elke dienst uit lib/aanbod.ts hoort er één te hebben. */
const VIGNETTEN: Record<string, () => string> = {
  calling: vignetCalling,
  chat: vignetChat,
  workflow: vignetWorkflow,
  mail: vignetMailAuto,
  web: vignetWeb,
  dashboard: vignetDashboard,
};

/** Eén tegel: mono-kop, vignetvenster, titel en één zin — zoals op de site. */
function tegel(d: (typeof DIENSTEN)[number], nummer: number, totaal: number): string {
  const vignet = (VIGNETTEN[d.sleutel] ?? vignetDashboard)();
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background:${K.wit};border:1px solid ${K.lijn};border-radius:16px;">
  <tr>
    <td style="padding:11px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td align="left">${monoLabel(veilig(d.categorie.toUpperCase()), K.accent)}</td>
        <td align="right">${monoLabel(`${String(nummer).padStart(2, "0")} / ${String(totaal).padStart(2, "0")}`, K.teller)}</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:${K.vignet};border-top:1px solid ${K.lijnZacht};border-bottom:1px solid ${K.lijnZacht};padding:13px 15px;height:150px;" height="150" valign="middle">
      ${vignet}
    </td>
  </tr>
  <tr>
    <td style="padding:13px 15px 14px 15px;font-family:${LETTER};">
      <p style="margin:0 0 5px 0;font-size:15px;font-weight:800;color:${K.tekst};letter-spacing:-0.2px;">${veilig(d.naam)}</p>
      <p style="margin:0;font-size:12.5px;line-height:1.5;color:${K.gedempt};">${veilig(d.belofte)}</p>
    </td>
  </tr>
</table>`;
}

/** Twee tegels naast elkaar; op smalle schermen vallen ze onder elkaar. */
function tegelRij(links: string, rechts: string | null): string {
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

/** Eén pijler als regel met een accentblokje ervoor — het Waarom-blok. */
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
function knop(label: string, href: string, vulling: string, tekstkleur: string, rand?: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
  <tr>
    <td align="center" style="background:${vulling};border-radius:999px;${rand ? `border:1px solid ${rand};` : ""}">
      <a href="${veilig(href)}" style="display:inline-block;padding:14px 30px;font-family:${LETTER};font-size:15px;font-weight:700;color:${tekstkleur};text-decoration:none;border-radius:999px;">${veilig(label)}</a>
    </td>
  </tr>
</table>`;
}

export function promoTegelsMail(invoer: PromoTegelsInvoer): PromoTegelsMail {
  const { aanhef, intro, slot, afspraakUrl, whatsappUrl, contactMail, logoUrl } = invoer;

  const onderwerp = invoer.onderwerp.trim() || standaardPromoVelden(null).onderwerp;

  const afspraakHref = afspraakUrl?.trim()
    ? afspraakUrl.trim()
    : `mailto:${contactMail}?subject=${encodeURIComponent("Graag een gratis AI- en automatiseringsaudit")}`;

  // De regel die in de inbox naast het onderwerp staat. Zonder deze regel toont
  // Gmail de eerste woorden van de HTML — meestal iets zinloos.
  const voorregel =
    intro.split(/\n/).map((r) => r.trim()).find(Boolean) ??
    "AI-agents, workflows en automatisering — met een gratis audit als eerste stap.";

  // De tegelselectie, in de vaste volgorde van het aanbod. Een lege of
  // onherkenbare selectie betekent: alles — een mail zonder tegels is geen
  // tegelmail meer.
  const gekozen = DIENSTEN.filter((d) => invoer.diensten.includes(d.sleutel));
  const tegels = gekozen.length > 0 ? gekozen : DIENSTEN;

  const rijen: string[] = [];
  for (let i = 0; i < tegels.length; i += 2) {
    rijen.push(
      tegelRij(
        tegel(tegels[i], i + 1, tegels.length),
        tegels[i + 1] ? tegel(tegels[i + 1], i + 2, tegels.length) : null,
      ),
    );
  }

  const introHtml = alineas(
    intro,
    `margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${K.gedempt};font-family:${LETTER};`,
  );
  // De afsluiting staat op het navy CTA-vlak, dus in de lichte tekstkleur.
  const slotHtml = slot.trim()
    ? alineas(
        slot,
        `margin:0 0 18px 0;font-size:15px;line-height:1.65;color:${K.lichtblauw};font-family:${LETTER};`,
      )
    : "";

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
  /* Smalle weergave: Gmail op mobiel houdt media queries; Outlook negeert ze
     en toont de brede versie — die past daar toch. */
  @media only screen and (max-width:600px) {
    .kolom { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
    .omhulsel { width:100% !important; max-width:100% !important; }
    .rand { padding-left:18px !important; padding-right:18px !important; }
    .groot { font-size:26px !important; line-height:1.15 !important; }
  }

  /* De beweging. Uitsluitend hier, nooit nodig voor de leesbaarheid: Apple
     Mail en iOS spelen dit af, Gmail en Outlook gooien het weg en tonen het
     stilstaande tafereel dat inline al klopt. */
  @keyframes mGolf { 0%,100% { transform:scaleY(.4); } 50% { transform:scaleY(1); } }
  @keyframes mStip { 0%,100% { opacity:.25; } 50% { opacity:1; } }
  @keyframes mChat { 0% { opacity:0; transform:translateY(8px); } 9%,76% { opacity:1; transform:translateY(0); } 90%,100% { opacity:0; transform:translateY(-5px); } }
  @keyframes mPunt { 0%,100% { opacity:.15; } 50% { opacity:1; } }
  @keyframes mTik { 0%,6% { opacity:.2; transform:scale(.6); } 16%,90% { opacity:1; transform:scale(1); } 100% { opacity:.2; } }
  @keyframes mLaad { 0% { width:6%; } 55%,100% { width:62%; } }
  @keyframes mSkel { 0%,100% { opacity:.45; } 50% { opacity:1; } }
  @keyframes mVul { 0% { transform:scaleX(.12); } 42%,100% { transform:scaleX(1); } }
  @keyframes mGroei { 0% { transform:scaleY(.15); } 40%,88% { transform:scaleY(1); } 100% { transform:scaleY(.15); } }
  @keyframes mCaret { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
  @keyframes mDraai { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

  .m-golf { animation:mGolf 1.3s ease-in-out infinite; transform-origin:center; }
  .mg1{animation-delay:0s}.mg2{animation-delay:.11s}.mg3{animation-delay:.22s}.mg4{animation-delay:.33s}
  .mg5{animation-delay:.44s}.mg6{animation-delay:.55s}.mg7{animation-delay:.66s}.mg8{animation-delay:.77s}
  .m-stip { animation:mStip 1.4s ease-in-out infinite; }
  .m-chat { animation:mChat 13s cubic-bezier(.4,0,.2,1) infinite; }
  .mc1{animation-delay:.4s}.mc2{animation-delay:2.2s}.mc3{animation-delay:4s}
  .m-punt { animation:mPunt 2.4s ease-in-out infinite; }
  .mp1{animation-delay:0s}.mp2{animation-delay:.8s}.mp3{animation-delay:1.6s}
  .m-tik { animation:mTik 9s cubic-bezier(.4,0,.2,1) infinite; }
  .mt1{animation-delay:.5s}.mt2{animation-delay:1.7s}.mt3{animation-delay:2.9s}
  .m-laad { animation:mLaad 5.5s cubic-bezier(.4,0,.2,1) infinite; }
  .m-skel { animation:mSkel 3.2s ease-in-out infinite; }
  .ms1{animation-delay:0s}.ms2{animation-delay:.3s}.ms3{animation-delay:.5s}
  .m-vul { animation:mVul 6s cubic-bezier(.33,0,.2,1) infinite; transform-origin:left; }
  .mv1{animation-delay:0s}.mv2{animation-delay:.4s}
  .m-groei { animation:mGroei 6.8s cubic-bezier(.33,0,.2,1) infinite; transform-origin:bottom; }
  .mb1{animation-delay:0s}.mb2{animation-delay:.15s}.mb3{animation-delay:.3s}
  .mb4{animation-delay:.45s}.mb5{animation-delay:.6s}.mb6{animation-delay:.75s}
  .m-caret { animation:mCaret 1.1s step-end infinite; }
  .m-draai { animation:mDraai 6s linear infinite; }
</style>
</head>
<body style="margin:0;padding:0;background:${K.zand};">
<!-- De regel die in de inbox naast het onderwerp verschijnt. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${veilig(voorregel)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${K.zand};">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="omhulsel" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">

  <!-- Briefhoofd: navy, met de heroregel van de landingspagina en een caret
       die knippert waar de mailclient dat toelaat. -->
  <tr>
    <td class="rand" style="background:${K.navy};padding:26px 32px 30px 32px;font-family:${LETTER};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- Het beeldmerk kaal op het navy, precies zoals de kop van de
               landingspagina. Geen tegeltje eromheen: het PNG is doorzichtig,
               de zeshoek zakt weg in het navy en de witte V blijft staan — dat
               ís het merk. Een lichtgekleurd vlakje eromheen maakt er een
               losse sticker van die op de site nergens voorkomt.

               alt="" omdat de naam er in leesbare tekst naast staat; blokkeert
               een mailprogramma afbeeldingen, dan mist er niets. -->
          <td width="40" valign="middle">
            <img src="${veilig(logoUrl)}" width="40" height="44" alt="" style="display:block;width:40px;height:44px;border:0;">
          </td>
          <td valign="middle" style="padding-left:12px;font-size:15px;font-weight:800;letter-spacing:1.2px;color:${K.zand};">
            VIESA <span style="font-weight:400;color:${K.lichtblauw};">AUTOMATIONS</span>
          </td>
        </tr>
      </table>

      <p class="groot" style="margin:26px 0 12px 0;font-size:30px;line-height:1.12;font-weight:800;color:${K.zand};letter-spacing:-0.5px;">
        Wij maken werkprocessen slimmer en&nbsp;mobieler.<span class="m-caret" style="display:inline-block;width:10px;height:24px;background:${K.accent};font-size:0;line-height:0;vertical-align:-2px;margin-left:6px;">&nbsp;</span>
      </p>
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:2.2px;color:${K.accent};">
        AI-AGENTS &middot; TELEFONIE &middot; CHAT &middot; E-MAIL &middot; WORKFLOWS &middot; DASHBOARDS
      </p>
    </td>
  </tr>

  <!-- Het persoonlijke deel: aanhef en intro, bewerkbaar in het verzendvenster. -->
  <tr>
    <td class="rand" style="background:${K.wit};padding:30px 32px 12px 32px;font-family:${LETTER};">
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:${K.tekst};">${veilig(aanhef)}</p>
      ${introHtml}
    </td>
  </tr>

  <!-- De tegels, op het zand van de landingspagina. -->
  <tr>
    <td class="rand" style="background:${K.zand};padding:26px 26px 14px 26px;font-family:${LETTER};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td align="center" style="padding:0 0 4px 0;">${monoLabel("WAT WIJ DOEN", K.navy, 10)}</td></tr>
        <tr><td align="center" style="padding:0 0 6px 0;font-size:23px;line-height:1.15;font-weight:800;color:${K.tekst};letter-spacing:-0.4px;">Onze diensten</td></tr>
        <tr><td align="center" style="padding:0 20px 20px 20px;font-size:13.5px;line-height:1.6;color:${K.gedempt};">Zes pijlers, &eacute;&eacute;n aanspreekpunt: van AI-agents en automatisering tot maatwerk software en digitale platformen.</td></tr>
        ${rijen.join("")}
      </table>
    </td>
  </tr>

  <!-- Waarom Viesa -->
  <tr>
    <td class="rand" style="background:${K.diepnavy};padding:30px 32px;font-family:${LETTER};">
      <p style="margin:0 0 4px 0;font-family:${MONO};font-size:9px;letter-spacing:1.8px;color:${K.accent};">WAAROM VIESA</p>
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

  <!-- De vraag, met de bewerkbare afsluiting erboven. -->
  <tr>
    <td class="rand" style="background:${K.navy};padding:34px 32px;font-family:${LETTER};">
      ${slotHtml}
      <p style="margin:0 0 10px 0;font-size:24px;line-height:1.2;font-weight:800;color:${K.zand};">
        Klaar om uw bedrijf te automatiseren?
      </p>
      <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:${K.lichtblauw};">
        ${veilig(AUDIT_BELOFTE)}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:10px;">${knop("Plan een gratis audit", afspraakHref, K.accent, K.wit)}</td>
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
        Liever niets meer van ons horen? E&eacute;n antwoord met &ldquo;stop&rdquo; is genoeg.
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
    ...intro
      .split(/\n\s*\n/)
      .map((a) => a.trim())
      .filter(Boolean),
    "",
    "WAT WIJ BOUWEN",
    ...tegels.map((d) => `- ${d.naam}: ${d.belofte}`),
    "",
    "WAAROM VIESA",
    ...PIJLERS.map((p) => `- ${p.naam}: ${p.uitleg}`),
    "",
    ...(slot.trim() ? [slot.trim(), ""] : []),
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
