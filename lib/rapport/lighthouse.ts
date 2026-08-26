import type { LighthouseAudit } from "@/lib/scan";
import type { Bevinding, Ernst } from "./types";

/**
 * Van Lighthouse-audits naar bevindingen in klanttaal.
 *
 * Lighthouse draait in een echte Chrome bij Google en voert daarmee de volledige
 * toegankelijkheidscontrole uit — kleurcontrast inbegrepen, wat je zonder
 * gerenderde pagina niet kunt meten. Dat scheelt ons een eigen browser; wat
 * overblijft is vertaalwerk, en dat is precies wat hier staat.
 *
 * Puur, dus testbaar zonder netwerk. Juist hier gaat het stil fout: een audit
 * met scoreDisplayMode "manual" heeft score null, en die per ongeluk als
 * "gezakt" tellen maakt van elke site een slechte site.
 */

/**
 * De audits die we tonen, met een titel in gewone taal.
 *
 * Lighthouse's eigen titels zijn Engels en technisch ("Background and
 * foreground colors do not have a sufficient contrast ratio"). Voor een rapport
 * dat een klant doorstuurt naar zijn directie moet dat een zin zijn die iemand
 * zonder achtergrondkennis begrijpt.
 *
 * `elementen` zegt of het zin heeft om het aantal geraakte elementen te tonen:
 * bij "9 elementen met te weinig contrast" wel, bij "de pagina heeft een titel"
 * niet — dat is er één of geen.
 */
type AuditUitleg = {
  titel: string;
  uitleg: string;
  advies: string;
  ernst: Ernst;
  elementen?: boolean;
};

export const TOEGANKELIJKHEID: Record<string, AuditUitleg> = {
  "color-contrast": {
    titel: "te weinig contrast met de achtergrond",
    uitleg: "Tekst die te weinig afsteekt tegen de achtergrond waar hij op staat.",
    advies: "Slecht leesbaar bij fel zonlicht, op een ouder scherm of met verminderd zicht. Maak de tekst donkerder of de achtergrond lichter.",
    ernst: "ernstig",
    elementen: true,
  },
  "link-name": {
    titel: "links zonder leesbare tekst",
    uitleg: "Een schermlezer leest deze links voor als 'link', zonder te zeggen waarheen.",
    advies: "Geef elke link een tekst die op zichzelf duidelijk is — dus niet 'lees meer'.",
    ernst: "ernstig",
    elementen: true,
  },
  "button-name": {
    titel: "knoppen zonder naam",
    uitleg: "Knoppen waar alleen een pictogram in staat en geen tekst.",
    advies: "Geef de knop een aria-label, zodat een schermlezer kan zeggen wat hij doet.",
    ernst: "ernstig",
    elementen: true,
  },
  "image-alt": {
    titel: "afbeeldingen zonder beschrijving",
    uitleg: "Afbeeldingen zonder alt-tekst worden overgeslagen door een schermlezer.",
    advies: "Beschrijf in één zin wat er te zien is. Is de afbeelding puur decoratief, geef dan een lege alt mee.",
    ernst: "gemiddeld",
    elementen: true,
  },
  label: {
    titel: "invoervelden zonder label",
    uitleg: "Velden in een formulier waarvan niet duidelijk is wat erin moet.",
    advies: "Koppel elk veld aan een label; dat helpt ook bezoekers die gewoon met de muis werken.",
    ernst: "ernstig",
    elementen: true,
  },
  "html-has-lang": {
    titel: "geen taal vastgelegd",
    uitleg: "Zonder taal weet een schermlezer niet in welke uitspraak hij moet voorlezen.",
    advies: 'Zet lang="nl" op de html-tag.',
    ernst: "gemiddeld",
  },
  "document-title": {
    titel: "geen paginatitel",
    uitleg: "De titel is wat er in het tabblad staat en wat een schermlezer als eerste noemt.",
    advies: "Geef elke pagina een eigen, beschrijvende titel.",
    ernst: "ernstig",
  },
  "heading-order": {
    titel: "koppen in de verkeerde volgorde",
    uitleg: "Kopniveaus die een stap overslaan, waardoor de structuur niet klopt.",
    advies: "Gebruik koppen op volgorde; een h3 hoort onder een h2 te staan, niet los.",
    ernst: "licht",
    elementen: true,
  },
  "meta-viewport": {
    titel: "inzoomen is uitgeschakeld",
    uitleg: "Bezoekers kunnen de pagina op hun telefoon niet vergroten.",
    advies: "Haal user-scalable=no en een vaste maximum-scale uit de viewport-tag.",
    ernst: "ernstig",
  },
  "duplicate-id-aria": {
    titel: "dezelfde id komt meerdere keren voor",
    uitleg: "Hulpsoftware raakt in de war als twee elementen dezelfde id dragen.",
    advies: "Maak elke id uniek binnen de pagina.",
    ernst: "gemiddeld",
    elementen: true,
  },
  list: {
    titel: "lijsten met verkeerde opbouw",
    uitleg: "Opsommingen die niet als lijst zijn opgebouwd, waardoor de samenhang wegvalt.",
    advies: "Zet lijstitems rechtstreeks in een ul of ol.",
    ernst: "licht",
    elementen: true,
  },
  "aria-required-attr": {
    titel: "aria-rollen zonder verplichte gegevens",
    uitleg: "Elementen met een aria-rol waar de bijbehorende informatie ontbreekt.",
    advies: "Vul de verplichte aria-attributen aan, of haal de rol weg.",
    ernst: "gemiddeld",
    elementen: true,
  },
  "aria-valid-attr-value": {
    titel: "aria-attributen met een ongeldige waarde",
    uitleg: "Hulpsoftware negeert een aria-attribuut waarvan de waarde niet klopt.",
    advies: "Corrigeer de waarde, of haal het attribuut weg.",
    ernst: "gemiddeld",
    elementen: true,
  },
  bypass: {
    titel: "geen manier om het menu over te slaan",
    uitleg: "Wie met het toetsenbord werkt, moet op elke pagina het hele menu doorlopen.",
    advies: "Zet bovenaan een verborgen 'naar de inhoud'-link.",
    ernst: "gemiddeld",
  },
};

/** Audits die iets zeggen over of de pagina het technisch dóét. */
export const WERKING: Record<string, AuditUitleg> = {
  "errors-in-console": {
    titel: "fouten in de browser",
    uitleg: "De pagina meldt fouten terwijl hij laadt. Dat is wat er stukgaat vlak voordat iets niet werkt.",
    advies: "Loop de meldingen na; ze wijzen meestal op een functie die het op sommige apparaten niet doet.",
    ernst: "gemiddeld",
    elementen: true,
  },
  "is-on-https": {
    titel: "onderdelen via een onbeveiligde verbinding",
    uitleg: "Delen van de pagina worden zonder https opgehaald.",
    advies: "Laad alles via https; browsers blokkeren onbeveiligde onderdelen steeds vaker helemaal.",
    ernst: "ernstig",
    elementen: true,
  },
  redirects: {
    titel: "onnodige doorverwijzingen",
    uitleg: "De browser wordt eerst naar een ander adres gestuurd voordat de pagina laadt.",
    advies: "Verwijs rechtstreeks naar het eindadres; elke tussenstap kost een halve seconde.",
    ernst: "licht",
  },
  "server-response-time": {
    titel: "de server doet er lang over",
    uitleg: "De tijd tussen de aanvraag en het eerste antwoord van de server.",
    advies: "Kijk naar caching of een zwaardere hostingklasse; dit zit vóór alles wat de bezoeker ziet.",
    ernst: "gemiddeld",
  },
  viewport: {
    titel: "niet ingesteld op mobiel",
    uitleg: "Zonder viewport-instelling toont een telefoon de desktopversie uitgezoomd.",
    advies: "Zet de standaard viewport-meta in de kop van de pagina.",
    ernst: "ernstig",
  },
};

/** Is deze audit daadwerkelijk beoordeeld? */
export function isBeoordeeld(audit: LighthouseAudit): boolean {
  const modus = audit.scoreDisplayMode;
  // "manual" en "notApplicable" betekenen dat Lighthouse géén uitspraak doet.
  // Die als gezakt tellen maakt van elke site een slechte site.
  if (modus === "manual" || modus === "notApplicable" || modus === "informative") return false;
  return typeof audit.score === "number";
}

/** Aantal geraakte elementen, als de audit die meegeeft. */
export function aantalElementen(audit: LighthouseAudit): number {
  const items = audit.details?.items;
  return Array.isArray(items) ? items.length : 0;
}

/**
 * Zet een groep Lighthouse-audits om naar bevindingen.
 *
 * Alleen audits die we kunnen uitleggen komen erin: een rapport met dertig
 * Engelse regeltjes leest niemand, en de tien die ertoe doen dekken in de
 * praktijk vrijwel alles wat een bezoeker merkt.
 */
export function bevindingenUitAudits(
  audits: Record<string, LighthouseAudit>,
  woordenboek: Record<string, AuditUitleg>,
): Bevinding[] {
  const bevindingen: Bevinding[] = [];

  for (const [id, uitleg] of Object.entries(woordenboek)) {
    const audit = audits[id];
    if (!audit || !isBeoordeeld(audit)) continue;

    const gezakt = audit.score === 0;
    const aantal = aantalElementen(audit);

    bevindingen.push({
      titel: gezakt ? uitleg.titel : `${uitleg.titel} — in orde`,
      aantal: gezakt && uitleg.elementen && aantal > 0
        ? `${aantal} ${aantal === 1 ? "element" : "elementen"}`
        : undefined,
      uitleg: uitleg.uitleg,
      advies: gezakt ? uitleg.advies : undefined,
      ernst: gezakt ? uitleg.ernst : "info",
      goed: !gezakt,
    });
  }

  // Zwaarste eerst; dat is de volgorde waarin je ze bespreekt.
  const rang: Record<Ernst, number> = { ernstig: 0, gemiddeld: 1, licht: 2, info: 3 };
  return bevindingen.sort((a, b) => rang[a.ernst] - rang[b.ernst]);
}

/**
 * De punten waar Lighthouse géén uitspraak over doet.
 *
 * Regel 4 uit het bouwplan in de praktijk: deze staan in het rapport omdat een
 * meting die overal een antwoord op heeft, geen eerlijke meting is.
 */
export function nietBeoordeeldeAudits(
  audits: Record<string, LighthouseAudit>,
  woordenboek: Record<string, AuditUitleg>,
): string[] {
  const uit: string[] = [];
  for (const [id, uitleg] of Object.entries(woordenboek)) {
    const audit = audits[id];
    if (audit && !isBeoordeeld(audit)) {
      uit.push(`${uitleg.titel} — dit punt is alleen met de hand te beoordelen.`);
    }
  }
  return uit;
}

/** Het totaal aantal geraakte elementen over alle gezakte audits heen. */
export function geraakteElementen(
  audits: Record<string, LighthouseAudit>,
  woordenboek: Record<string, AuditUitleg>,
): number {
  let totaal = 0;
  for (const id of Object.keys(woordenboek)) {
    const audit = audits[id];
    if (audit && isBeoordeeld(audit) && audit.score === 0) totaal += aantalElementen(audit);
  }
  return totaal;
}
