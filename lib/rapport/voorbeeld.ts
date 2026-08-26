import type { Rapport } from "./types";
import { VOORBEELD_AFDRUK } from "./voorbeeld-afdruk";

/**
 * Een volledig ingevuld voorbeeldrapport.
 *
 * Bestaat om het sjabloon te kunnen bekijken zonder eerst een scan te draaien —
 * en, belangrijker, om elk elementtype minstens één keer te tonen: een gemeten
 * onderdeel en een niet-gemeten onderdeel, een meetbalk waar lager beter is en
 * een waar hoger beter is, een goede en een slechte vaststelling, bevindingen
 * in elke ernst, en technologiepillen. Ziet één daarvan er scheef uit, dan valt
 * dat hier op in plaats van bij een klant.
 *
 * De cijfers zijn verzonnen. Fase 2 vervangt dit door de echte meting.
 */
export const VOORBEELDRAPPORT: Rapport = {
  bedrijf: "Voorbeeld Webshop",
  host: "voorbeeld-webshop.nl",
  url: "https://voorbeeld-webshop.nl",
  totaalScore: 74,
  schermafdruk: VOORBEELD_AFDRUK,
  ogAfbeelding: null,

  onderdelen: [
    {
      sleutel: "vindbaarheid",
      nummer: 1,
      naam: "Vindbaarheid",
      oordeelKop: "Google vindt uw producten en leest de details",
      methode:
        "We halen uw robots.txt op, controleren per pagina de kop van het document, en kijken of uw sitemap is aangemeld. Dat is precies de route die een zoekmachine ook aflegt.",
      score: 92,
      norm: 80,
      prioriteit: 2,
      oordeel:
        "Google kan uw site vinden en begrijpen. Hier is geen werk te doen — de basis staat, en dat scheelt u een hoop bijstelwerk later.",
      metingen: [
        {
          titel: "Lengte van de omschrijving",
          uitleg:
            "Hoeveel tekens uw omschrijving telt. Te kort en Google vult zelf iets aan; te lang en het wordt afgekapt.",
          waarde: 138,
          weergave: "138 tekens",
          schaal: {
            zones: [
              { tot: 119, stand: "beter", label: "kort" },
              { tot: 160, stand: "goed", label: "op lengte" },
              { tot: 260, stand: "nodig", label: "te lang" },
            ],
          },
          duiding:
            "138 tekens — Google kan uw omschrijving volledig tonen, precies zoals u hem bedoeld hebt.",
        },
      ],
      vaststellingen: [
        {
          titel: "Toegankelijk voor Google",
          uitleg: "Of Google uw pagina's mag bekijken en of u een sitemap hebt aangemeld.",
          antwoord: "Alle 2 gescande pagina's bereikbaar",
          stand: "goed",
        },
      ],
      bevindingen: [
        {
          titel: "Sitemap aangemeld in robots.txt",
          uitleg: "Uw robots.txt verwijst naar de sitemap, dus Google hoeft niet te raden welke pagina's er zijn.",
          ernst: "info",
          goed: true,
        },
      ],
      acties: ["Niets. Dit onderdeel staat goed — laat het zoals het is."],
    },

    {
      sleutel: "snelheid",
      nummer: 2,
      naam: "Snelheid",
      oordeelKop: "De pagina laadt, maar het eerste beeld laat op zich wachten",
      methode:
        "We meten met Lighthouse hoe uw pagina zich gedraagt op een gemiddelde mobiele verbinding — dus niet op uw eigen glasvezel, maar zoals een bezoeker het onderweg ervaart.",
      score: 66,
      norm: 80,
      prioriteit: 4,
      oordeel:
        "Uw pagina komt aan, maar de eerste twee seconden ziet een bezoeker niets. Dat is precies het moment waarop mensen teruggaan naar de zoekresultaten.",
      metingen: [
        {
          titel: "Eerste teken van leven",
          uitleg: "Hoe lang het duurt voordat er voor het eerst iets op uw scherm verschijnt.",
          waarde: 2.2,
          weergave: "2,2 s",
          schaal: {
            zones: [
              { tot: 1.8, stand: "goed", label: "snel" },
              { tot: 3.0, stand: "beter", label: "kan beter" },
              { tot: 5.0, stand: "nodig", label: "traag" },
            ],
          },
          duiding: "2,2 s voordat er iets verschijnt. Dat voelt als wachten, ook al is de pagina onderweg.",
        },
        {
          titel: "Verspringende pagina",
          uitleg: "Hoe vaak dingen op uw pagina wegspringen terwijl iemand aan het lezen of klikken is.",
          waarde: 0.039,
          weergave: "0,039",
          schaal: {
            zones: [
              { tot: 0.1, stand: "goed", label: "stabiel" },
              { tot: 0.25, stand: "beter", label: "kan beter" },
              { tot: 0.5, stand: "nodig", label: "aandacht nodig" },
            ],
          },
          duiding: "0,039. De pagina staat stil terwijl u 'm bekijkt, precies zoals het hoort.",
        },
      ],
      vaststellingen: [],
      bevindingen: [
        {
          titel: "Afbeeldingen worden op volle grootte geladen",
          aantal: "6 afbeeldingen",
          uitleg: "De browser krijgt grotere afbeeldingen binnen dan hij op het scherm laat zien.",
          advies: "Lever ze op de maat waarop ze getoond worden; dat scheelt hier ongeveer een seconde.",
          ernst: "gemiddeld",
          goed: false,
        },
        {
          titel: "Geen onnodig blokkerende scripts",
          uitleg: "Er staat niets bovenaan de pagina dat het tekenen van het scherm tegenhoudt.",
          ernst: "info",
          goed: true,
        },
      ],
      acties: [
        "Lever afbeeldingen uit op de afmeting waarop ze getoond worden.",
        "Laad het lettertype vooraf, zodat tekst niet pas na het lettertype verschijnt.",
      ],
    },

    {
      sleutel: "toegankelijkheid",
      nummer: 3,
      naam: "Toegankelijkheid",
      oordeelKop: "De belangrijkste onderdelen zijn bruikbaar",
      methode:
        "We lopen elke pagina na op de punten die onder de wettelijke norm (WCAG) vallen, met dezelfde controle die een toezichthouder zou gebruiken.",
      score: 72,
      norm: 80,
      prioriteit: 3,
      oordeel:
        "Klein om te verhelpen, en de moeite waard: een toegankelijke webshop helpt meer bezoekers én voorkomt dat toegankelijkheid later een kostbaar project wordt.",
      metingen: [
        {
          titel: "Toegankelijkheidsproblemen",
          uitleg:
            "Plekken waar iets niet werkt voor mensen die een schermlezer of toetsenbord gebruiken. Alleen de punten die onder de wettelijke norm vallen.",
          waarde: 16,
          weergave: "3 problemen, 16 elementen",
          schaal: {
            zones: [
              { tot: 5, stand: "goed", label: "goed" },
              { tot: 40, stand: "beter", label: "kan beter" },
              { tot: 100, stand: "nodig", label: "aandacht nodig" },
            ],
          },
          duiding:
            "Verspreid over 2 pagina's gevonden, en samen raken ze 16 elementen. Hoe meer elementen geraakt zijn, hoe groter de kans dat een bezoeker met een beperking vastloopt.",
        },
      ],
      vaststellingen: [],
      bevindingen: [
        {
          titel: "elementen met te weinig contrast",
          aantal: "9 elementen",
          uitleg: "Tekst met te weinig contrast tegen de achtergrond.",
          advies: "Slecht leesbaar bij fel zonlicht, op een oud scherm, of met verminderd zicht.",
          ernst: "ernstig",
          goed: false,
        },
        {
          titel: "links zonder leesbare tekst",
          aantal: "5 elementen",
          uitleg: "Een schermlezer leest deze links voor als 'link', zonder te zeggen waarheen.",
          advies: "Geef elke link een tekst die op zichzelf duidelijk is.",
          ernst: "ernstig",
          goed: false,
        },
        {
          titel: "Knoppen zijn met het toetsenbord te bereiken",
          uitleg: "U kunt de hele bestelknop-route doorlopen zonder muis.",
          ernst: "info",
          goed: true,
        },
      ],
      acties: [
        "Verhoog het contrast van de negen gemarkeerde teksten naar de norm.",
        "Geef de vijf links een omschrijvende tekst in plaats van 'lees meer'.",
      ],
    },

    {
      sleutel: "werking",
      nummer: 4,
      naam: "Werking",
      oordeelKop: "Uw pagina's doen wat ze moeten doen",
      methode:
        "We vragen 2 pagina's op zoals een bezoeker dat doet en kijken of ze werken: een normaal antwoord van de server, geen terugval naar http, en niets dat stukloopt in de browser. Dat lijkt vanzelfsprekend, maar we vinden hier regelmatig een productpagina die stil crasht op mobiel.",
      score: 100,
      norm: 100,
      prioriteit: 1,
      oordeel: "Alles wat we opvroegen kwam netjes binnen. Hier is geen werk te doen.",
      metingen: [],
      vaststellingen: [
        {
          titel: "De homepage",
          uitleg: "Antwoord 200, in 340 ms, via https.",
          antwoord: "Doet het",
          stand: "goed",
        },
        {
          titel: "/producten/tuinstoelen",
          uitleg: "Antwoord 200, in 410 ms, via https.",
          antwoord: "Doet het",
          stand: "goed",
        },
      ],
      bevindingen: [
        {
          titel: "fouten in de browser",
          aantal: "3 elementen",
          uitleg: "De pagina meldt fouten terwijl hij laadt. Dat is wat er stukgaat vlak voordat iets niet werkt.",
          advies: "Loop de meldingen na; ze wijzen meestal op een functie die het op sommige apparaten niet doet.",
          ernst: "gemiddeld",
          goed: false,
        },
      ],
      acties: ["Loop de drie consolefouten na; die wijzen op iets dat op sommige apparaten niet werkt."],
    },

    {
      sleutel: "techniek",
      nummer: 5,
      naam: "Techniek",
      oordeelKop: "Wat er onder uw winkel draait",
      methode:
        "We herkennen de gebruikte technologie aan de buitenkant van de pagina. Versienummers staan meestal alleen in code die pas in de browser draait, en daar kijken we niet in — we doen dus geen uitspraak over of u bij bent.",
      score: null,
      norm: 80,
      prioriteit: 1,
      oordeel:
        "Een moderne basis. Dit onderdeel krijgt geen cijfer omdat we niet kunnen vaststellen welke versies draaien; het staat er als achtergrond bij het gesprek.",
      metingen: [],
      vaststellingen: [
        {
          titel: "Meetscripts op uw site",
          uitleg: "Zonder meting weet u niet welke advertentie of welke pagina uw omzet oplevert.",
          antwoord: "Geen meetscripts gevonden",
          stand: "nodig",
        },
      ],
      bevindingen: [],
      technologie: [
        { groep: "Webserver", namen: ["Nginx"] },
        { groep: "Winkelsoftware", namen: ["WooCommerce", "WordPress"] },
        { groep: "Beveiliging", namen: ["HSTS"] },
        { groep: "Overig", namen: ["jQuery", "Cloudflare"] },
      ],
      acties: [
        "Zet een meetscript op de site, zodat bestellingen aan een bron gekoppeld worden.",
        "Leg vast welke versies draaien, zodat achterstallig onderhoud zichtbaar wordt.",
      ],
    },
  ],

  // Eén kaart per onderdeel, zwaarste eerst — precies wat samenvattingVan()
  // uit een echte scan maakt. Hier handmatig, zodat de previewpagina de
  // afdrukindeling met het werkelijke aantal kaarten toont.
  samenvatting: [
    {
      sleutel: "werking",
      naam: "Werking",
      score: 100,
      norm: 100,
      goed: 2,
      teDoen: 0,
      vraag: "Doen uw pagina's het gewoon?",
      kop: "Uw pagina's doen wat ze moeten doen",
      verhaal:
        "Alles wat we opvroegen kwam netjes binnen: een normaal antwoord van de server, via https, zonder terugval.",
      waaromBelangrijk: "Dit onderdeel staat op 100 van 100; de norm is dat alles werkt.",
      slotzin: "Geen spoed — dit staat er goed voor.",
      prioriteit: 1,
    },
    {
      sleutel: "snelheid",
      naam: "Snelheid",
      score: 46,
      norm: 80,
      goed: 2,
      teDoen: 2,
      vraag: "Hoe snel is uw webshop?",
      kop: "Het eerste beeld laat twee seconden op zich wachten",
      verhaal:
        "Uw pagina komt netjes aan, maar de eerste twee seconden ziet een bezoeker een leeg scherm. Dat is precies het moment waarop mensen teruggaan naar de zoekresultaten.",
      waaromBelangrijk:
        "Elke seconde wachten kost bestellingen, en op mobiel het hardst — daar is het geduld het kortst.",
      slotzin: "Dit zouden wij als eerste bespreken.",
      prioriteit: 4,
    },
    {
      sleutel: "techniek",
      naam: "Techniek",
      score: null,
      norm: 80,
      goed: 0,
      teDoen: 1,
      vraag: "Wat draait er onder uw winkel?",
      kop: "Vijf technologieën gevonden, maar geen meting",
      verhaal:
        "Zonder meting weet u niet welke advertentie of welke pagina uw omzet oplevert — dat is het eerste dat we zouden inrichten.",
      waaromBelangrijk:
        "Dit onderdeel telt niet mee in het totaal, maar hoort wel bij het gesprek.",
      slotzin: "Dit zouden wij als eerste bespreken.",
      prioriteit: 4,
    },
    {
      sleutel: "toegankelijkheid",
      naam: "Toegankelijkheid",
      score: 71,
      norm: 80,
      goed: 3,
      teDoen: 2,
      vraag: "Kan iedereen uw winkel gebruiken?",
      kop: "De belangrijkste onderdelen zijn bruikbaar",
      verhaal:
        "We kwamen een aantal toegankelijkheidssignalen tegen die aandacht verdienen, vooral op uw homepage — plekken waar een bezoeker met een schermlezer of toetsenbord meer moeite doet dan nodig.",
      waaromBelangrijk:
        "Een toegankelijke webshop helpt meer bezoekers én voorkomt dat toegankelijkheid later een kostbaar project wordt.",
      slotzin: "Klein om te verhelpen, en de moeite waard.",
      prioriteit: 3,
    },
    {
      sleutel: "vindbaarheid",
      naam: "Vindbaarheid",
      score: 92,
      norm: 80,
      goed: 4,
      teDoen: 0,
      vraag: "Kan Google uw site vinden en lezen?",
      kop: "Google vindt uw producten en leest de details",
      verhaal:
        "Google kan uw site vinden en begrijpen. Hier is geen werk te doen — de basis staat, en dat scheelt u een hoop bijstelwerk later.",
      waaromBelangrijk: "Dit onderdeel staat op 92 van 100; de norm is 80.",
      slotzin: "Geen spoed — dit staat er goed voor.",
      prioriteit: 2,
    },
  ],

  herkomst: {
    paginas: 2,
    controles: 11,
    rekentijdSeconden: 114,
    gemetenOp: "2026-08-26T14:41:00.000Z",
    instrumenten: [
      { naam: "Lighthouse", versie: "13.4.1" },
      { naam: "axe-core", versie: "4.10.2" },
    ],
    scoremodel: "1.1.0",
  },

  nietBeoordeeld: [
    "Of uw winkelsoftware op de nieuwste versie draait — dat staat niet in de pagina zelf.",
    "Of het bestelproces tot en met de betaling werkt; we plaatsen geen proefbestelling.",
    "Hoe snel uw site is voor terugkerende bezoekers met een gevulde cache.",
  ],
};
