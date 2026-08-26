/**
 * Gratis, directe prototypes — geen AI-aanroep, dus geen tokens.
 *
 * TIEN professionele design systems, los te kiezen van de branche. De branche
 * bepaalt de INHOUD (diensten, USP's, teksten); het design system bepaalt de
 * VORM. Huisstijl komt van de klant zelf: logo, merkkleur (theme-color), foto
 * en omschrijving worden van de geplakte URL overgenomen (lib/site-scrape.ts).
 *
 * Design systems (referenties uit echte sites):
 *  - "webshop"   — bol.com: e-commerce met USP-balk, zoekbalk, dealkaarten.
 *  - "premium"   — stephex.com: donkere held, streep-motieven, genummerde kaarten.
 *  - "horeca"    — decafes.nl: donker-warm, handschrift-accenten, menukolommen.
 *  - "corporate" — novar.nl: strak wit, serif-kop met accentstreep, werkwijze.
 *  - "verhaal"   — patagonia.com: full-bleed statement, verhalende blokken.
 *  - "tech"      — SaaS (Linear/Vercel): stikdonker, gloed-orb, featuregrid.
 *  - "vastgoed"  — architectuurmagazine: foto-held, serif linksonder, editorial.
 *  - "studio"    — No Waste Army × bureau-dimanche: crème, chunky kapitalen,
 *                  schuine zwevende kaarten.
 *  - "minimal"   — Scandinavisch licht: veel wit, dunne lijnen, genummerde rijen.
 *  - "klassiek"  — chic serif: ivoor, gouden haarlijnen, gecentreerd.
 *
 * Bewust GEEN emoji — dat oogt direct als AI-werk. Iconen zijn strakke inline
 * SVG-lijntekeningen; beeldvlakken zonder klantfoto tonen een abstract
 * kleurpatroon in plaats van een plaatje van een robot.
 */

export type PrototypeType = "website" | "app";

export type DesignStijl =
  | "webshop"
  | "premium"
  | "horeca"
  | "corporate"
  | "verhaal"
  | "tech"
  | "vastgoed"
  | "studio"
  | "minimal"
  | "klassiek";

/** De kiesbare design systems, met leesbare naam voor de UI. */
export const DESIGN_SYSTEMS: { key: DesignStijl; naam: string }[] = [
  { key: "webshop", naam: "Commerce (bol.com-stijl)" },
  { key: "premium", naam: "Premium donker (Stephex-stijl)" },
  { key: "horeca", naam: "Warm donker (D.E Café-stijl)" },
  { key: "corporate", naam: "Zakelijk strak (Novar-stijl)" },
  { key: "verhaal", naam: "Verhalend (Patagonia-stijl)" },
  { key: "tech", naam: "Tech / SaaS (Linear-stijl)" },
  { key: "vastgoed", naam: "Editorial (magazine-stijl)" },
  { key: "studio", naam: "Studio speels (Framer-stijl)" },
  { key: "minimal", naam: "Minimaal licht (Scandinavisch)" },
  { key: "klassiek", naam: "Klassiek chic (serif)" },
];

/* ================================ ICONEN ================================== */
/* Strakke lijniconen (24×24, stroke=currentColor) — geen emoji. */

const IKOON_PADEN: Record<string, string> = {
  doos: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  wagen:
    '<path d="M1 7h13v9H1z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6" cy="18.5" r="1.7"/><circle cx="17.5" cy="18.5" r="1.7"/>',
  schild: '<path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z"/>',
  gesprek: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  ster: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z"/>',
  vink: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  huis: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/>',
  gebouw:
    '<rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
  document:
    '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  hart: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  persoon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>',
  zoek: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  tas: '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  bliksem: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
  koppeling:
    '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  grafiek: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>',
  kompas: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  wereld: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18z"/>',
  klok: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  instelling:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  pen: '<path d="M12 19l7-7-4-4-7 7-1 5 5-1z"/><path d="M15 8l1-1a2.8 2.8 0 0 1 4 4l-1 1"/>',
  retour: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  slot: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  locatie:
    '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  cadeau:
    '<rect x="4" y="10" width="16" height="11"/><path d="M4 7h16v3H4zM12 7v14M12 7c-2 0-3.5-1-3.5-2.5a1.8 1.8 0 0 1 3.5-.5M12 7c2 0 3.5-1 3.5-2.5a1.8 1.8 0 0 0-3.5-.5"/>',
  koffie:
    '<path d="M4 8h12v6a5 5 0 0 1-10 0V8z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2M6 3v2M10 3v2M14 3v2"/>',
  glas: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3z"/><path d="M12 13v6M8 21h8"/>',
};

/** Eén icoon als inline SVG-lijntekening. */
function ikoon(naam: string, maat = 22): string {
  const paden = IKOON_PADEN[naam] ?? IKOON_PADEN.ster;
  return `<svg width="${maat}" height="${maat}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paden}</svg>`;
}

/* ================================ DATA ==================================== */

type Dienst = { icoon: string; titel: string; omschrijving: string };

type Sjabloon = {
  stijl: DesignStijl;
  /** Hoofdkleur (donker) en een nog donkerder variant voor gradients. */
  kleur1: string;
  kleur2: string;
  /** Het ene accent (knoppen, badges, streepjes). */
  accent: string;
  /** Lichte pagina-achtergrond voor de lichte stijlen. */
  licht: string;
  tagline: string;
  subtitel: string;
  diensten: Dienst[];
  usps: string[];
  /** Alleen voor de webshop-stijl: de categorie-navigatie. */
  categorieen?: string[];
  ctaKop: string;
  ctaTekst: string;
  ctaKnop: string;
};

const SJABLONEN: Record<string, Sjabloon> = {
  "E-commerce / webshop": {
    stijl: "webshop",
    kleur1: "#0000a4",
    kleur2: "#00006e",
    accent: "#F26B21",
    licht: "#ffffff",
    tagline: "Alles voor een vliegende start",
    subtitel: "Vandaag besteld, morgen in huis — en gratis retourneren.",
    categorieen: ["Nieuw binnen", "Bestsellers", "Acties", "Cadeaus", "Merken"],
    diensten: [
      { icoon: "wagen", titel: "Snelle levering", omschrijving: "Voor 23:59 besteld, morgen in huis." },
      { icoon: "slot", titel: "Veilig betalen", omschrijving: "iDEAL, creditcard of achteraf betalen." },
      { icoon: "retour", titel: "Gratis retour", omschrijving: "Niet goed? 30 dagen bedenktijd." },
      { icoon: "ster", titel: "Echte reviews", omschrijving: "Beoordeeld door duizenden klanten." },
    ],
    usps: ["Gratis verzending vanaf €25", "Bezorging dezelfde dag mogelijk", "Gratis retourneren"],
    ctaKop: "Ontdek het volledige assortiment",
    ctaTekst: "Duizenden producten, scherp geprijsd en direct leverbaar.",
    ctaKnop: "Bekijk nu",
  },
  "Retail / detailhandel": {
    stijl: "webshop",
    kleur1: "#7c2d12",
    kleur2: "#431407",
    accent: "#F26B21",
    licht: "#fffaf5",
    tagline: "In de winkel én online",
    subtitel: "Kom langs voor advies, of bestel vanuit je luie stoel.",
    categorieen: ["Assortiment", "Nieuw", "Aanbiedingen", "Cadeaubon", "Onze winkel"],
    diensten: [
      { icoon: "gebouw", titel: "Bezoek de winkel", omschrijving: "Zie, voel en probeer het product zelf." },
      { icoon: "tas", titel: "Click & collect", omschrijving: "Online reserveren, dezelfde dag ophalen." },
      { icoon: "gesprek", titel: "Persoonlijk advies", omschrijving: "Deskundig personeel dat met je meedenkt." },
      { icoon: "cadeau", titel: "Cadeauservice", omschrijving: "Gratis ingepakt, met een persoonlijke kaart." },
    ],
    usps: ["Ruime openingstijden", "Deskundig advies", "Ook online te bestellen"],
    ctaKop: "Kom eens langs",
    ctaTekst: "Onze winkel is zes dagen per week geopend — de koffie staat klaar.",
    ctaKnop: "Plan je bezoek",
  },
  Groothandel: {
    stijl: "premium",
    kleur1: "#15181c",
    kleur2: "#0a0c0e",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw partner in groothandel",
    subtitel: "Betrouwbaar, op voorraad en op tijd — al jaren de vaste schakel van onze afnemers.",
    diensten: [
      { icoon: "doos", titel: "Assortiment", omschrijving: "Een breed pakket, afgestemd op uw branche en volume." },
      { icoon: "gebouw", titel: "Voorraad", omschrijving: "Groot magazijn, snelle omslag, altijd leverbaar." },
      { icoon: "wagen", titel: "Logistiek", omschrijving: "Vaste levermomenten waar u uw planning op bouwt." },
      { icoon: "persoon", titel: "Partnerschap", omschrijving: "Eén vaste contactpersoon en heldere staffelprijzen." },
    ],
    usps: ["Groot eigen magazijn", "Vaste contactpersoon", "Scherpe staffelprijzen"],
    ctaKop: "Zaken doen?",
    ctaTekst: "Vraag een vrijblijvende prijslijst aan of plan een kennismaking op locatie.",
    ctaKnop: "Neem contact op",
  },
  "Transport & logistiek": {
    stijl: "premium",
    kleur1: "#101828",
    kleur2: "#070d18",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw zending. Op tijd. Waar dan ook.",
    subtitel: "Nationaal en internationaal transport met de voorspelbaarheid waar uw klanten op rekenen.",
    diensten: [
      { icoon: "wagen", titel: "Wegtransport", omschrijving: "Fijnmazige distributie en volle ladingen, dag en nacht." },
      { icoon: "locatie", titel: "Track & trace", omschrijving: "Altijd inzicht in waar uw zending zich bevindt." },
      { icoon: "doos", titel: "Warehousing", omschrijving: "Opslag, orderpicking en voorraadbeheer onder één dak." },
      { icoon: "wereld", titel: "Internationaal", omschrijving: "Vaste lijndiensten door heel Europa." },
    ],
    usps: ["Landelijke dekking", "Realtime volgen", "Flexibele planning"],
    ctaKop: "Een zending plannen?",
    ctaTekst: "Vraag binnen een werkdag een offerte op maat aan.",
    ctaKnop: "Offerte aanvragen",
  },
  "Bouw & installatie": {
    stijl: "premium",
    kleur1: "#1c1917",
    kleur2: "#0c0a09",
    accent: "#F26B21",
    licht: "#faf9f7",
    tagline: "Vakwerk waar u op kunt bouwen",
    subtitel: "Van eerste schets tot oplevering — één aannemer, één aanspreekpunt, één afspraak.",
    diensten: [
      { icoon: "pen", titel: "Advies & ontwerp", omschrijving: "Een vrijblijvend gesprek en een heldere prijsopgave vooraf." },
      { icoon: "gebouw", titel: "Uitvoering", omschrijving: "Eigen vakmensen die de klus netjes en op tijd afronden." },
      { icoon: "instelling", titel: "Installatie", omschrijving: "Elektra, water en klimaat — alles in één hand." },
      { icoon: "vink", titel: "Nazorg", omschrijving: "Ook na oplevering bereikbaar voor vragen en garantie." },
    ],
    usps: ["Gratis offerte", "Erkend vakmanschap", "Garantie op het werk"],
    ctaKop: "Plannen?",
    ctaTekst: "Plan een vrijblijvende opname — we kijken graag mee op locatie.",
    ctaKnop: "Plan een opname",
  },
  "Productie / fabrikant": {
    stijl: "corporate",
    kleur1: "#1e3a5f",
    kleur2: "#0f1f33",
    accent: "#F26B21",
    licht: "#f6f8fa",
    tagline: "Van tekening tot eindproduct",
    subtitel: "Maakwerk in serie of enkelstuks — gemaakt om te blijven, geleverd op afspraak.",
    diensten: [
      { icoon: "instelling", titel: "Maatwerkproductie", omschrijving: "Elk product exact volgens de specificaties van de opdracht." },
      { icoon: "zoek", titel: "Kwaliteitscontrole", omschrijving: "Elke batch gecontroleerd voordat die de deur uit gaat." },
      { icoon: "document", titel: "Engineering", omschrijving: "We denken mee over materiaal, proces en maakbaarheid." },
      { icoon: "klok", titel: "Leverbetrouwbaarheid", omschrijving: "Een afgesproken datum is bij ons een harde datum." },
    ],
    usps: ["Eigen productie", "Kwaliteitsgarantie", "Korte levertijden"],
    ctaKop: "Iets laten maken?",
    ctaTekst: "Stuur uw tekening of omschrijving en ontvang snel een doordachte offerte.",
    ctaKnop: "Offerte aanvragen",
  },
  "Zakelijke dienstverlening": {
    stijl: "corporate",
    kleur1: "#19445B",
    kleur2: "#0d2836",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw uitdaging, onze expertise",
    subtitel: "Advies dat niet in een rapport blijft steken, maar in de praktijk het verschil maakt.",
    diensten: [
      { icoon: "kompas", titel: "Advies", omschrijving: "Een helder plan van aanpak, afgestemd op uw situatie." },
      { icoon: "bliksem", titel: "Uitvoering", omschrijving: "We nemen het werk uit handen en houden u op de hoogte." },
      { icoon: "grafiek", titel: "Resultaat", omschrijving: "Meetbare afspraken vooraf, zodat u weet waar u aan toe bent." },
      { icoon: "persoon", titel: "Nazorg", omschrijving: "Ook na afronding blijven we bereikbaar voor vragen." },
    ],
    usps: ["Persoonlijk contact", "Bewezen aanpak", "Snel op te starten"],
    ctaKop: "Kennismaken?",
    ctaTekst: "In een gesprek van een half uur weet u of we bij elkaar passen.",
    ctaKnop: "Plan een kennismaking",
  },
  Gezondheidszorg: {
    stijl: "corporate",
    kleur1: "#065f46",
    kleur2: "#022c22",
    accent: "#F26B21",
    licht: "#f4faf7",
    tagline: "Goede zorg, dichtbij",
    subtitel: "Persoonlijke aandacht, korte wachttijden en een praktijk waar u zich welkom voelt.",
    diensten: [
      { icoon: "agenda", titel: "Afspraak maken", omschrijving: "Online of aan de balie — snel een moment dat u uitkomt." },
      { icoon: "hart", titel: "Behandeling", omschrijving: "Persoonlijke aandacht, volgens de laatste richtlijnen." },
      { icoon: "vink", titel: "Preventie", omschrijving: "Voorkomen is beter — we kijken verder dan de klacht." },
      { icoon: "gesprek", titel: "Bereikbaar", omschrijving: "Duidelijke vervolgstappen en bereikbaar bij vragen." },
    ],
    usps: ["Korte wachttijd", "Persoonlijke zorg", "Online een afspraak maken"],
    ctaKop: "Een afspraak maken?",
    ctaTekst: "Nieuwe patiënten zijn welkom — inschrijven is zo geregeld.",
    ctaKnop: "Maak een afspraak",
  },
  Horeca: {
    stijl: "horeca",
    kleur1: "#181210",
    kleur2: "#0d0a08",
    accent: "#c9a227",
    licht: "#f4f6f9",
    tagline: "Jouw tweede huiskamer",
    subtitel: "Vers bereid, met aandacht voor seizoen en herkomst.",
    diensten: [
      { icoon: "document", titel: "Menukaart", omschrijving: "Vers bereid, met aandacht voor seizoen en herkomst." },
      { icoon: "koffie", titel: "Koffie & gebak", omschrijving: "De hele dag door, huisgemaakt en met liefde." },
      { icoon: "agenda", titel: "Reserveren", omschrijving: "Binnen een minuut een tafel geboekt, ook voor groepen." },
      { icoon: "glas", titel: "Feesten & partijen", omschrijving: "Van verjaardag tot bedrijfsborrel — wij regelen het." },
    ],
    usps: ["Vers & lokaal", "Direct online reserveren", "Ook voor groepen"],
    ctaKop: "Reserveer een tafel",
    ctaTekst: "Vandaag geopend — schuif aan en laat je verrassen.",
    ctaKnop: "Reserveren",
  },
  "IT & Software": {
    stijl: "tech",
    kleur1: "#0f172a",
    kleur2: "#020617",
    accent: "#6366f1",
    licht: "#f8fafc",
    tagline: "Software die gewoon werkt",
    subtitel: "Gebouwd voor schaal, uitgelegd in gewone taal — geen jargon, wel resultaat.",
    diensten: [
      { icoon: "bliksem", titel: "Snel live", omschrijving: "Van intake tot werkende oplossing, zonder maandenlange trajecten." },
      { icoon: "koppeling", titel: "Koppelingen", omschrijving: "Sluit aan op de systemen die u al gebruikt." },
      { icoon: "schild", titel: "Veilig & stabiel", omschrijving: "Gebouwd met beveiliging en betrouwbaarheid als uitgangspunt." },
      { icoon: "grafiek", titel: "Inzicht", omschrijving: "Heldere rapportages in plaats van een zwarte doos." },
    ],
    usps: ["Snel opgeleverd", "Nederlandse support", "Schaalt met u mee"],
    ctaKop: "Klaar voor de volgende stap?",
    ctaTekst: "Plan een demo en zie binnen een kwartier wat mogelijk is.",
    ctaKnop: "Plan een demo",
  },
  "Marketing & creatief": {
    stijl: "studio",
    kleur1: "#1f2a1f",
    kleur2: "#121a12",
    accent: "#c05a36",
    licht: "#f2efe6",
    tagline: "Werk dat blijft hangen",
    subtitel: "Merken, campagnes en content met karakter — gemaakt om op te vallen.",
    diensten: [
      { icoon: "pen", titel: "Branding", omschrijving: "Een merk met een eigen gezicht, van logo tot tone-of-voice." },
      { icoon: "gesprek", titel: "Campagnes", omschrijving: "Van concept tot uitvoering, online en offline." },
      { icoon: "document", titel: "Content", omschrijving: "Beeld, video en copy die het verhaal dragen." },
      { icoon: "kompas", titel: "Strategie", omschrijving: "Eerst snappen wie je bent — dan pas maken." },
    ],
    usps: ["Eigen studio", "Vast team", "Van idee tot uitvoering"],
    ctaKop: "Iets moois maken?",
    ctaTekst: "Laat je project zien — we denken vrijblijvend mee.",
    ctaKnop: "Start een project",
  },
  "Vastgoed & makelaardij": {
    stijl: "vastgoed",
    kleur1: "#292524",
    kleur2: "#1c1917",
    accent: "#b45309",
    licht: "#faf9f7",
    tagline: "Uw volgende adres begint hier",
    subtitel: "Persoonlijke begeleiding van bezichtiging tot sleuteloverdracht.",
    diensten: [
      { icoon: "huis", titel: "Aanbod", omschrijving: "Een actueel overzicht van beschikbare woningen en panden." },
      { icoon: "persoon", titel: "Aan- en verkoop", omschrijving: "Persoonlijke begeleiding, van waardebepaling tot overdracht." },
      { icoon: "document", titel: "Taxatie", omschrijving: "Een onderbouwde waardebepaling door een erkend taxateur." },
      { icoon: "kompas", titel: "Advies", omschrijving: "Onafhankelijk advies, ook bij een aankoop elders." },
    ],
    usps: ["Lokale marktkennis", "Persoonlijke begeleiding", "Erkend taxateur"],
    ctaKop: "Op zoek naar uw volgende stap?",
    ctaTekst: "Plan een vrijblijvend gesprek — we denken graag met u mee.",
    ctaKnop: "Plan een gesprek",
  },
  Overig: {
    stijl: "verhaal",
    kleur1: "#19445B",
    kleur2: "#0d2836",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Graag tot uw dienst",
    subtitel: "Eén duidelijke belofte, waargemaakt met vakmanschap en aandacht.",
    diensten: [
      { icoon: "ster", titel: "Wat we doen", omschrijving: "Een helder aanbod, uitgelegd in gewone taal." },
      { icoon: "kompas", titel: "Hoe het werkt", omschrijving: "In een paar stappen van vraag naar oplossing." },
      { icoon: "gesprek", titel: "Contact", omschrijving: "Snel een antwoord op uw vraag, zonder omwegen." },
    ],
    usps: ["Persoonlijk contact", "Snel antwoord", "Duidelijke afspraken"],
    ctaKop: "Benieuwd wat we voor u kunnen doen?",
    ctaTekst: "Stel uw vraag — u hoort snel van ons.",
    ctaKnop: "Neem contact op",
  },
};

/** Alle branches met een eigen sjabloon — voor de kiezer in de UI. */
export const SJABLOON_BRANCHES = Object.keys(SJABLONEN);

function sjabloonVoor(branche: string | null): Sjabloon {
  if (branche && SJABLONEN[branche]) return SJABLONEN[branche];
  return SJABLONEN.Overig;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Initialen voor het logo-blokje (max 2 tekens). */
function initialen(bedrijf: string): string {
  const delen = bedrijf.split(/\s+/).filter(Boolean);
  const init = delen.length >= 2 ? delen[0][0] + delen[1][0] : bedrijf.slice(0, 2);
  return escapeHtml(init.toUpperCase());
}

const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SCRIPT = "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', cursive";

function wrap(titel: string, css: string, body: string): string {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
img{max-width:100%}
svg{display:inline-block;vertical-align:middle}
${css}
</style>
</head>
<body>${body}</body>
</html>`;
}

/* ============================ HUISSTIJL VAN DE KLANT ====================== */

/** Echte content van de bestaande site van de lead (lib/site-scrape.ts) — optioneel. */
export type EchtContent = {
  titel: string | null;
  beschrijving: string | null;
  kop: string | null;
  secties: { titel: string; tekst: string }[];
  navigatie: string[];
  afbeeldingen: string[];
  logo: string | null;
  merkkleur: string | null;
};

type Invoer = { bedrijf: string; plaats: string | null; sj: Sjabloon; echt?: EchtContent };

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * De n-de echte foto, rondlopend door wat er opgehaald is.
 *
 * De scraper haalt er tot zes op; die werden alleen niet gebruikt — elk vlak
 * kreeg dezelfde eerste foto. Met een index krijgt elk beeldvlak een ander
 * beeld van de klant, en dat is precies wat een prototype op maat laat lijken.
 */
function foto(echt: EchtContent | undefined, index = 0): string | null {
  const lijst = echt?.afbeeldingen ?? [];
  if (lijst.length === 0) return null;
  return lijst[index % lijst.length];
}

/** Achtergrond-CSS voor een held-sectie: een echte foto onder een kleurovergang, als er één is. */
function heroAchtergrond(sj: Sjabloon, echt: EchtContent | undefined, hoek = 160): string {
  const beeld = foto(echt, 0);
  if (!beeld) return "";
  return ` style="background-image:linear-gradient(${hoek}deg, ${hexRgba(sj.kleur1, 0.82)}, ${hexRgba(sj.kleur2, 0.9)}), url('${escapeHtml(beeld)}');background-size:cover;background-position:center;"`;
}

/**
 * Voor een los beeldvlak: een echte foto, anders een abstract kleurpatroon
 * (cirkels in de merkkleuren) — bewust geen emoji of illustratie.
 */
function beeldOfPatroon(sj: Sjabloon, echt: EchtContent | undefined, index = 0): string {
  const beeld = foto(echt, index);
  if (beeld) {
    return `<img src="${escapeHtml(beeld)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />`;
  }
  return `<span style="position:absolute;inset:0;background:radial-gradient(circle at 30% 30%, ${hexRgba(sj.accent, 0.5)}, transparent 45%),radial-gradient(circle at 75% 65%, ${hexRgba("#ffffff", 0.14)}, transparent 40%),linear-gradient(150deg,${sj.kleur1},${sj.kleur2})"></span>`;
}

/**
 * De menubalk: de échte paginanamen van de klant als we ze hebben, anders de
 * verzonnen items van het sjabloon.
 *
 * Dit is een klein detail met een groot effect: een prospect die "Hengsten ·
 * Africhting · Te koop" in het menu ziet staan, ziet zijn eigen site — niet een
 * ontwerp dat toevallig ook over hem zou kunnen gaan.
 */
function menuItems(echt: EchtContent | undefined, terugval: string[]): string {
  const items = (echt?.navigatie?.length ?? 0) >= 2 ? echt!.navigatie : terugval;
  return items.map((n) => `<span>${escapeHtml(n)}</span>`).join("");
}

/** Het echte logo als <img>, of null als er geen is (dan blijft de initialenbadge staan). */
function merkBeeld(echt: EchtContent | undefined, hoogte = "1.9rem"): string | null {
  if (!echt?.logo) return null;
  return `<img src="${escapeHtml(echt.logo)}" alt="" style="height:${hoogte};width:auto;max-width:9rem;max-height:${hoogte};object-fit:contain;vertical-align:middle" />`;
}

/** Logo als het er is, anders de gekleurde initialenbadge. */
function merkOfBadge(echt: EchtContent | undefined, bedrijf: string, badgeKlasse: string, hoogte = "1.9rem"): string {
  return merkBeeld(echt, hoogte) ?? `<span class="${badgeKlasse}">${initialen(bedrijf)}</span>`;
}

function verdonker(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (kanaal: number) => Math.round(kanaal * (1 - factor));
  const naarHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${naarHex(mix(r))}${naarHex(mix(g))}${naarHex(mix(b))}`;
}

/**
 * Past de merkkleur van de klant toe op het sjabloon, als de site die zelf
 * opgeeft (theme-color). kleur2 wordt afgeleid door 'm donkerder te maken.
 */
function metHuisstijl(sj: Sjabloon, echt: EchtContent | null | undefined): Sjabloon {
  if (!echt?.merkkleur) return sj;
  return { ...sj, kleur1: echt.merkkleur, kleur2: verdonker(echt.merkkleur, 0.45) };
}

/**
 * Vervangt de verzonnen sjabloonteksten door wat er werkelijk op de site van de
 * klant staat.
 *
 * Dit is het verschil tussen "Graag tot uw dienst" en de kop die het bedrijf
 * zelf gekozen heeft. De iconen blijven van het sjabloon — die horen bij het
 * ontwerp, niet bij de inhoud — maar kop, subtitel en de dienstenteksten komen
 * van de klant zodra we ze hebben. Nog steeds 0 tokens: het is opgehaalde
 * tekst, geen gegenereerde.
 *
 * Alles is per veld optioneel: ontbreekt er iets, dan blijft de sjabloontekst
 * staan in plaats van dat er een gat valt.
 */
function metEchteTeksten(sj: Sjabloon, echt: EchtContent | null | undefined): Sjabloon {
  if (!echt) return sj;
  const uit: Sjabloon = { ...sj };

  // De echte h1 als tagline. Een heel lange kop is meestal een zin uit de
  // lopende tekst en geen kop; die laten we liggen.
  const kop = echt.kop?.trim();
  if (kop && kop.length <= 80) uit.tagline = kop;

  // De meta-omschrijving als subtitel — die is voor bezoekers geschreven.
  const subtitel = echt.beschrijving?.trim();
  if (subtitel && subtitel.length <= 200) uit.subtitel = subtitel;

  // De echte secties als diensten, met de iconen van het sjabloon. Minder dan
  // twee bruikbare secties zegt te weinig; dan blijft het branchesjabloon staan.
  if (echt.secties.length >= 2) {
    uit.diensten = sj.diensten.map((dienst, i) => {
      const sectie = echt.secties[i];
      if (!sectie) return dienst;
      return {
        icoon: dienst.icoon,
        titel: sectie.titel,
        omschrijving: sectie.tekst,
      };
    });
  }

  return uit;
}

/* ============================== WEBSHOP (bol.com) ========================= */

function webshopWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const badges = ["SALE", "NIEUW", "TOP", "DEAL"];
  const tinten = ["#fde9d9", "#fdf3d9", "#e3f0fb", "#e9f7ea"];
  const kaarten = sj.diensten
    .map(
      (d, i) => `<article class="deal" style="background:${tinten[i % tinten.length]}">
        <span class="badge">${badges[i % badges.length]}</span>
        <span class="deal-icoon">${ikoon(d.icoon, 30)}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
        <span class="deal-pijl">›</span>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.licht};color:#111}
.usps{display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center;background:#f2f4f8;padding:.55rem 1rem;font-size:.8rem;color:#333}
.usps b{color:${sj.kleur1}}
header{background:${sj.kleur1};padding:1rem 1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}
.logo{color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-.02em;white-space:nowrap;display:flex;align-items:center;gap:.6rem}
.logo b{color:${sj.accent}}
.zoek{flex:1;min-width:220px;background:#fff;border-radius:999px;padding:.7rem 1.2rem;color:#98a2b3;font-size:.9rem;display:flex;justify-content:space-between;align-items:center}
.iconen{color:#fff;display:flex;gap:1rem;align-items:center}
nav{display:flex;gap:1.6rem;flex-wrap:wrap;padding:.8rem 1.5rem;border-bottom:1px solid #e6e9ef;font-size:.9rem;font-weight:600;color:${sj.kleur1}}
.hero{margin:1.5rem;display:grid;grid-template-columns:1.2fr 1fr;gap:1rem;background:linear-gradient(105deg,#fde9d9 55%,#fbd3ae);border-radius:1rem;padding:2.5rem 2rem;align-items:center}
.hero h1{font-size:clamp(1.8rem,4.5vw,3rem);color:${sj.kleur1};line-height:1.05;font-weight:800}
.hero p{margin-top:.8rem;color:#374151;font-size:1.05rem}
.knop{display:inline-block;margin-top:1.4rem;background:${sj.kleur1};color:#fff;font-weight:700;padding:.85rem 1.6rem;border-radius:.6rem;text-decoration:none}
.hero-beeld{position:relative;min-height:12rem;border-radius:.75rem;overflow:hidden}
.deals{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:0 1.5rem 2rem}
.deal{position:relative;border-radius:.9rem;padding:1.4rem;overflow:hidden}
.deal h3{color:${sj.kleur1};font-size:1.02rem;margin-top:.7rem}
.deal p{font-size:.85rem;color:#4b5563;margin-top:.3rem}
.badge{position:absolute;top:.9rem;right:.9rem;background:#e02b2b;color:#fff;font-size:.7rem;font-weight:800;border-radius:999px;padding:.35rem .6rem}
.deal-icoon{color:${sj.kleur1}}
.deal-pijl{position:absolute;bottom:.9rem;right:.9rem;background:${sj.kleur1};color:#fff;width:1.7rem;height:1.7rem;border-radius:.4rem;display:flex;align-items:center;justify-content:center;font-weight:700}
.cta{margin:0 1.5rem 2rem;background:${sj.kleur1};border-radius:1rem;color:#fff;padding:2.2rem;text-align:center}
.cta h2{font-size:1.5rem}
.cta p{margin-top:.5rem;opacity:.85}
.cta .knop{background:${sj.accent}}
footer{border-top:1px solid #e6e9ef;padding:1.5rem;text-align:center;font-size:.85rem;color:#667085}
@media(max-width:640px){.hero{grid-template-columns:1fr}}`;

  const body = `
  <div class="usps">${sj.usps.map((u) => `<span><b>${ikoon("vink", 14)}</b> ${escapeHtml(u)}</span>`).join("")}</div>
  <header>
    <span class="logo">${merkBeeld(echt, "1.9rem") ?? `${escapeHtml(bedrijf.toLowerCase())}<b>.</b>`}</span>
    <div class="zoek"><span>Waar ben je naar op zoek?</span>${ikoon("zoek", 17)}</div>
    <div class="iconen">${ikoon("hart", 20)}${ikoon("tas", 20)}</div>
  </header>
  <nav>${(sj.categorieen ?? []).map((c) => `<span>${escapeHtml(c)} ▾</span>`).join("")}</nav>
  <section class="hero">
    <div>
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
    </div>
    <div class="hero-beeld">${beeldOfPatroon(sj, echt, 1)}</div>
  </section>
  <section class="deals">${kaarten}</section>
  <section class="cta" id="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ PREMIUM (stephex.com) ======================= */

function premiumWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d, i) => `<article class="divisie">
        <span class="strepen" aria-hidden="true"></span>
        <div class="divisie-tekst">
          <h3>${escapeHtml(d.titel).toUpperCase()}</h3>
          <p>${escapeHtml(d.omschrijving)}</p>
        </div>
        <span class="nummer">0${i + 1}</span>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.licht};color:#101828}
.held{position:relative;min-height:88vh;display:flex;flex-direction:column;background:linear-gradient(160deg,${sj.kleur1},${sj.kleur2});color:#fff;overflow:hidden}
.held-nav{display:flex;justify-content:space-between;align-items:center;padding:1.6rem 2rem}
.merk{display:flex;align-items:center;gap:.8rem;font-weight:600;letter-spacing:.02em}
.merk-logo{background:#fff;color:${sj.kleur1};font-weight:900;padding:.35rem .6rem;font-size:1.05rem}
.held-nav-r{display:flex;align-items:center;gap:1.4rem;font-size:.9rem;opacity:.9}
.burger{background:#fff;width:2.6rem;height:2.6rem;display:flex;flex-direction:column;justify-content:center;gap:.32rem;padding:0 .55rem}
.burger i{display:block;height:2px;background:${sj.kleur1}}
.held-midden{flex:1;display:flex;flex-direction:column;justify-content:center;padding:2rem;max-width:60rem}
.held h1{font-size:clamp(2.2rem,6vw,4.2rem);font-weight:800;letter-spacing:-.01em;line-height:1.05;text-transform:uppercase}
.held p{margin-top:1.2rem;font-size:1.05rem;opacity:.8;max-width:34rem}
.scroll{align-self:center;padding-bottom:1.6rem;font-size:.8rem;letter-spacing:.15em;opacity:.7;text-align:center}
.scroll::before{content:"";display:block;width:1px;height:2.6rem;background:#fff;margin:0 auto .5rem}
.hoek{position:absolute;right:-2rem;bottom:-2rem;width:16rem;height:9rem;background:repeating-linear-gradient(45deg,rgba(255,255,255,.85) 0 6px,transparent 6px 16px)}
.divisies{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;padding:2.5rem 1.5rem;max-width:75rem;margin:0 auto}
.divisie{position:relative;display:flex;align-items:center;gap:1.2rem;background:linear-gradient(120deg,${sj.kleur1},${sj.kleur2});color:#fff;padding:2.2rem 1.6rem;min-height:9.5rem}
.strepen{width:3.4rem;height:3.4rem;flex:none;background:repeating-linear-gradient(45deg,#fff 0 4px,transparent 4px 10px)}
.divisie h3{font-size:1.25rem;font-weight:800;letter-spacing:.03em}
.divisie p{margin-top:.4rem;font-size:.85rem;opacity:.75;max-width:24rem}
.nummer{position:absolute;top:1rem;right:1.2rem;background:#fff;color:#101828;font-weight:700;font-size:.95rem;padding:1.1rem .7rem}
.balk{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;padding:0 1.5rem 2.5rem}
.balk span{border:1px solid rgba(16,24,40,.2);border-radius:999px;padding:.55rem 1.2rem;font-size:.85rem;font-weight:600;color:${sj.kleur1}}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3.2rem 1.5rem}
.cta h2{font-size:1.7rem;text-transform:uppercase;letter-spacing:.03em}
.cta p{margin-top:.6rem;opacity:.8}
.knop{display:inline-block;margin-top:1.4rem;background:${sj.accent};color:#fff;font-weight:700;padding:.9rem 1.9rem;text-decoration:none}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}`;

  const body = `
  <section class="held"${heroAchtergrond(sj, echt)}>
    <div class="held-nav">
      <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")} ${escapeHtml(bedrijf)}</span>
      <div class="held-nav-r"><span>Contact</span><span>NL / EN</span><span class="burger"><i></i><i></i><i></i></span></div>
    </div>
    <div class="held-midden">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
    </div>
    <span class="scroll">SCROLL</span>
    <span class="hoek" aria-hidden="true"></span>
  </section>
  <section class="divisies">${kaarten}</section>
  <div class="balk">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================= HORECA (decafes.nl) ======================== */

function horecaWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const menuKolommen = sj.diensten
    .map(
      (d) => `<div class="kolom">
        <h3 class="script">${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving).toUpperCase()}</p>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.kleur1};color:#f5efe6;min-height:100vh}
.script{font-family:${FONT_SCRIPT};color:${sj.accent};font-weight:400}
header{display:flex;justify-content:space-between;align-items:center;padding:1.4rem 1.8rem}
.logo{display:flex;flex-direction:column;align-items:center;line-height:1}
.logo-zegel{background:#b02a2a;color:#fff;font-weight:800;border-radius:1rem 1rem 1rem 0;padding:.55rem .7rem;font-size:1rem}
.logo .script{font-size:1.3rem;margin-top:.2rem}
.knoppen{display:flex;gap:.7rem;align-items:center}
.pil{background:#b02a2a;color:#fff;font-weight:600;border-radius:999px;padding:.65rem 1.4rem;font-size:.9rem}
.rond{background:#000;color:#fff;width:2.6rem;height:2.6rem;border-radius:999px;display:flex;align-items:center;justify-content:center}
.held{text-align:center;padding:4.5rem 1.5rem 3.5rem;position:relative}
.held .script{font-size:clamp(1.6rem,4vw,2.6rem)}
.held h1{font-size:clamp(2rem,6vw,4rem);text-transform:uppercase;letter-spacing:.02em;margin-top:.4rem;font-weight:800}
.held .sub{margin-top:1rem;opacity:.7;font-size:1rem}
.watermerk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(3rem,10vw,7rem);font-weight:900;color:rgba(255,255,255,.04);text-transform:uppercase;pointer-events:none;white-space:nowrap;overflow:hidden}
.menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2.2rem;max-width:65rem;margin:0 auto;padding:1.5rem 1.8rem 3rem;text-align:center}
.kolom .script{font-size:1.7rem}
.kolom p{margin-top:.8rem;font-weight:700;letter-spacing:.04em;font-size:.85rem;line-height:1.9}
.info{max-width:34rem;margin:0 auto 3rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:1rem;padding:1.8rem;text-align:center}
.info h2{font-size:1.2rem;text-transform:uppercase;letter-spacing:.05em}
.info p{margin-top:.6rem;opacity:.75;font-size:.9rem}
.info .pil{display:inline-block;margin-top:1.2rem;text-decoration:none}
.usps{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem;padding:0 1.5rem 2.5rem;font-size:.85rem;opacity:.75}
footer{border-top:1px solid rgba(255,255,255,.12);padding:1.4rem;text-align:center;font-size:.8rem;opacity:.55}`;

  const body = `
  <header>
    <span class="logo">${merkOfBadge(echt, bedrijf, "logo-zegel")}<span class="script">${escapeHtml(bedrijf.split(/\s+/)[0])}</span></span>
    <span class="knoppen"><span class="pil">${escapeHtml(sj.ctaKnop)}</span><span class="rond">≡</span></span>
  </header>
  <section class="held"${heroAchtergrond(sj, echt, 200)}>
    <span class="watermerk">${escapeHtml(sj.tagline)}</span>
    <p class="script">Welkom bij</p>
    <h1>${escapeHtml(bedrijf)}</h1>
    <p class="sub">${escapeHtml(sj.subtitel)}${plaats ? ` · ${escapeHtml(plaats)}` : ""}</p>
  </section>
  <section class="menu">${menuKolommen}</section>
  <section class="info">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="pil" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <div class="usps">${sj.usps.map((u) => `<span>— ${escapeHtml(u)}</span>`).join("")}</div>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ CORPORATE (novar.nl) ======================== */

function corporateWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="kaart">
        <span class="kaart-icoon">${ikoon(d.icoon, 26)}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const stappen = ["Kennismaken", "Plan & afspraak", "Uitvoering & nazorg"]
    .map(
      (s, i) => `<div class="stap">
        <span class="stap-nr">${i + 1}</span>
        <p>${escapeHtml(s)}</p>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#101828}
header{display:flex;justify-content:space-between;align-items:center;padding:1.4rem 2rem;border-bottom:1px solid #eef1f5}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:700;color:${sj.kleur1}}
.merk-logo{background:${sj.kleur1};color:#fff;font-weight:900;border-radius:.4rem;padding:.35rem .55rem}
nav{display:flex;gap:1.6rem;font-size:.9rem;color:#475467}
.held{max-width:70rem;margin:0 auto;padding:4.5rem 2rem 3rem;display:grid;grid-template-columns:1.1fr .9fr;gap:2.5rem;align-items:center}
.held h1{font-size:clamp(2rem,5vw,3.4rem);font-family:${FONT_SERIF};color:${sj.kleur1};line-height:1.1}
.held h1::after{content:"";display:block;width:4.5rem;height:.3rem;background:${sj.accent};margin-top:1rem}
.held p{margin-top:1.2rem;color:#475467;font-size:1.05rem;max-width:32rem}
.knop{display:inline-block;margin-top:1.6rem;background:${sj.kleur1};color:#fff;font-weight:600;padding:.9rem 1.7rem;border-radius:.5rem;text-decoration:none}
.held-vlak{position:relative;border-radius:1.2rem;min-height:16rem;overflow:hidden}
.sectie{background:${sj.licht};padding:3rem 2rem}
.sectie-inner{max-width:70rem;margin:0 auto}
.sectie h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.7rem;text-align:center}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.2rem;margin-top:2rem}
.kaart{background:#fff;border-radius:.9rem;padding:1.6rem;box-shadow:0 1px 4px rgba(16,24,40,.08)}
.kaart-icoon{color:${sj.accent}}
.kaart h3{margin-top:.8rem;color:${sj.kleur1};font-size:1.05rem}
.kaart p{margin-top:.4rem;color:#475467;font-size:.9rem}
.stappen{display:flex;flex-wrap:wrap;justify-content:center;gap:2.5rem;padding:2.6rem 2rem}
.stap{text-align:center}
.stap-nr{display:inline-flex;width:2.6rem;height:2.6rem;border-radius:999px;background:${sj.accent};color:#fff;font-weight:800;align-items:center;justify-content:center;font-size:1.1rem}
.stap p{margin-top:.6rem;font-weight:600;color:${sj.kleur1};font-size:.95rem}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3rem 2rem}
.cta h2{font-family:${FONT_SERIF};font-size:1.7rem}
.cta p{margin-top:.6rem;opacity:.85}
.cta .knop{background:${sj.accent}}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}
@media(max-width:700px){.held{grid-template-columns:1fr}}`;

  const body = `
  <header>
    <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")}${escapeHtml(bedrijf)}</span>
    <nav>${menuItems(echt, ["Diensten", "Werkwijze", "Over ons", "Contact"])}</nav>
  </header>
  <section class="held">
    <div>
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </div>
    <div class="held-vlak">${beeldOfPatroon(sj, echt, 1)}</div>
  </section>
  <section class="sectie"><div class="sectie-inner">
    <h2>Wat we doen</h2>
    <div class="kaarten">${kaarten}</div>
  </div></section>
  <section class="stappen">${stappen}</section>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ VERHAAL (patagonia) ========================= */

function verhaalWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const blokken = sj.diensten
    .map(
      (d, i) => `<section class="blok${i % 2 ? " blok-om" : ""}">
        <div class="blok-vlak"><span class="blok-icoon">${ikoon(d.icoon, 46)}</span>${beeldOfPatroon(sj, echt, i + 1)}</div>
        <div class="blok-tekst">
          <h2>${escapeHtml(d.titel)}</h2>
          <p>${escapeHtml(d.omschrijving)}</p>
        </div>
      </section>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#101828}
.held{min-height:80vh;display:flex;flex-direction:column;background:linear-gradient(180deg,${sj.kleur2},${sj.kleur1});color:#fff}
.held-nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 2rem;font-weight:600}
.held-nav span:last-child{font-size:1.3rem}
.held-midden{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:2rem}
.held h1{font-size:clamp(2rem,6vw,3.8rem);font-family:${FONT_SERIF};max-width:44rem;line-height:1.15}
.held p{margin-top:1.1rem;opacity:.85;max-width:34rem;font-size:1.05rem}
.knop{display:inline-block;margin-top:1.8rem;background:#fff;color:${sj.kleur1};font-weight:700;padding:.9rem 1.9rem;border-radius:.4rem;text-decoration:none}
.blok{display:grid;grid-template-columns:1fr 1fr;max-width:72rem;margin:0 auto;min-height:20rem}
.blok-vlak{position:relative;display:flex;align-items:center;justify-content:center;color:#fff;overflow:hidden}
.blok-icoon{position:relative;z-index:1;opacity:.9}
.blok-tekst{display:flex;flex-direction:column;justify-content:center;padding:2.5rem}
.blok-om .blok-vlak{order:2}
.blok-tekst h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.6rem}
.blok-tekst p{margin-top:.8rem;color:#475467;max-width:26rem}
.usps{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;padding:2.5rem 1.5rem}
.usps span{border:1px solid rgba(16,24,40,.18);border-radius:999px;padding:.55rem 1.2rem;font-size:.85rem;font-weight:600;color:${sj.kleur1}}
.cta{background:${sj.licht};text-align:center;padding:3rem 2rem}
.cta h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.7rem}
.cta p{margin-top:.6rem;color:#475467}
.cta .knop{background:${sj.accent};color:#fff}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}
@media(max-width:640px){.blok{grid-template-columns:1fr}.blok-om .blok-vlak{order:0}}`;

  const body = `
  <section class="held"${heroAchtergrond(sj, echt, 180)}>
    <div class="held-nav"><span>${merkBeeld(echt, "1.9rem") ?? escapeHtml(bedrijf)}</span><span>≡</span></div>
    <div class="held-midden">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </div>
  </section>
  ${blokken}
  <div class="usps">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ================================ TECH (SaaS) ============================== */

function techWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="kaart">
        <span class="kaart-icoon">${ikoon(d.icoon, 24)}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const stappen = ["Intake", "Bouwen", "Live & support"]
    .map(
      (s, i) => `<div class="stap">
        <span class="stap-nr">0${i + 1}</span>
        <p>${escapeHtml(s)}</p>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#f8fafc;color:#e2e8f0}
.held{position:relative;background:${sj.kleur1};color:#e2e8f0;overflow:hidden}
.orb{position:absolute;top:-12rem;right:-8rem;width:28rem;height:28rem;border-radius:999px;background:radial-gradient(circle,${sj.accent}55,transparent 70%);filter:blur(10px)}
nav.top{position:relative;display:flex;justify-content:space-between;align-items:center;padding:1.4rem 2rem}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:700;color:#fff}
.merk-logo{background:${sj.accent};color:#fff;font-weight:900;border-radius:.4rem;padding:.35rem .55rem;font-size:.9rem}
.tag-pil{border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:.4rem 1rem;font-size:.8rem;color:#94a3b8}
.held-inner{position:relative;max-width:52rem;margin:0 auto;padding:4.5rem 2rem 5rem;text-align:center}
.held h1{font-size:clamp(2.1rem,6vw,3.6rem);font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff}
.held p{margin-top:1.2rem;color:#94a3b8;font-size:1.05rem;max-width:34rem;margin-left:auto;margin-right:auto}
.knop{display:inline-block;margin-top:1.8rem;background:${sj.accent};color:#fff;font-weight:700;padding:.9rem 1.9rem;border-radius:.6rem;text-decoration:none;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 8px 24px ${sj.accent}44}
.sectie{max-width:70rem;margin:0 auto;padding:3.5rem 2rem}
.sectie h2{text-align:center;color:#0f172a;font-size:1.6rem;font-weight:800}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.1rem;margin-top:2rem}
.kaart{background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.6rem}
.kaart-icoon{color:${sj.accent}}
.kaart h3{margin-top:.7rem;color:#0f172a;font-size:1.02rem;font-weight:700}
.kaart p{margin-top:.4rem;color:#475569;font-size:.9rem}
.stappen{display:flex;flex-wrap:wrap;justify-content:center;gap:2.5rem;padding:0 2rem 3.5rem}
.stap{text-align:center}
.stap-nr{font-family:monospace;font-weight:800;color:${sj.accent};font-size:1.1rem}
.stap p{margin-top:.4rem;font-weight:600;color:#0f172a;font-size:.95rem}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3.2rem 1.5rem}
.cta h2{font-size:1.6rem;font-weight:800}
.cta p{margin-top:.6rem;color:#94a3b8}
.cta .knop{background:${sj.accent}}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#94a3b8;background:${sj.kleur1}}`;

  const body = `
  <section class="held"${heroAchtergrond(sj, echt, 145)}>
    <span class="orb" aria-hidden="true"></span>
    <nav class="top">
      <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")}${escapeHtml(bedrijf)}</span>
      <span class="tag-pil">${plaats ? escapeHtml(plaats) : "Nederland"}</span>
    </nav>
    <div class="held-inner">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
    </div>
  </section>
  <section class="sectie">
    <h2>Wat het doet</h2>
    <div class="kaarten">${kaarten}</div>
  </section>
  <div class="stappen">${stappen}</div>
  <section class="cta" id="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ VASTGOED (makelaardij) ======================= */

function vastgoedWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="kaart">
        <span class="kaart-icoon">${ikoon(d.icoon, 26)}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#292524}
header{position:absolute;top:0;left:0;right:0;z-index:1;display:flex;justify-content:space-between;align-items:center;padding:1.6rem 2rem;color:#fff}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:600;letter-spacing:.02em}
.merk-logo{background:rgba(255,255,255,.15);font-weight:900;border-radius:.3rem;padding:.35rem .6rem;font-size:.95rem}
nav{display:flex;gap:1.6rem;font-size:.9rem}
.held{position:relative;min-height:78vh;display:flex;align-items:flex-end;background:linear-gradient(160deg,${sj.kleur1},${sj.kleur2});color:#fff;padding:3.5rem 2rem}
.held-inner{max-width:40rem}
.held h1{font-family:${FONT_SERIF};font-size:clamp(2.2rem,6vw,4rem);line-height:1.08}
.held p{margin-top:1.1rem;opacity:.85;font-size:1.05rem;max-width:30rem}
.knop{display:inline-block;margin-top:1.6rem;background:${sj.accent};color:#fff;font-weight:700;padding:.9rem 1.8rem;border-radius:.3rem;text-decoration:none}
.sectie{max-width:72rem;margin:0 auto;padding:3.5rem 2rem}
.sectie h2{font-family:${FONT_SERIF};font-size:1.7rem;text-align:center}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.2rem;margin-top:2rem}
.kaart{border-top:2px solid ${sj.accent};padding:1.6rem 0}
.kaart-icoon{color:${sj.accent}}
.kaart h3{margin-top:.7rem;font-family:${FONT_SERIF};font-size:1.15rem}
.kaart p{margin-top:.5rem;color:#57534e;font-size:.9rem}
.usps{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;padding:0 2rem 3rem}
.usps span{border:1px solid #e7e5e4;border-radius:999px;padding:.55rem 1.2rem;font-size:.85rem;font-weight:500;color:${sj.kleur1}}
.cta{background:${sj.licht};text-align:center;padding:3.2rem 2rem;border-top:1px solid #e7e5e4}
.cta h2{font-family:${FONT_SERIF};font-size:1.7rem;color:${sj.kleur1}}
.cta p{margin-top:.6rem;color:#57534e}
.cta .knop{background:${sj.kleur1}}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#78716c}`;

  const body = `
  <header>
    <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")}${escapeHtml(bedrijf)}</span>
    <nav>${menuItems(echt, ["Aanbod", "Diensten", "Over ons", "Contact"])}</nav>
  </header>
  <section class="held"${heroAchtergrond(sj, echt, 165)}>
    <div class="held-inner">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </div>
  </section>
  <section class="sectie">
    <h2>Onze dienstverlening</h2>
    <div class="kaarten">${kaarten}</div>
  </section>
  <div class="usps">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ==================== STUDIO (No Waste Army × bureau-dimanche) ============ */

function studioWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const rotaties = ["-4deg", "3deg", "-2deg", "5deg"];
  const kaarten = sj.diensten
    .map(
      (d, i) => `<article class="kaart" style="transform:rotate(${rotaties[i % rotaties.length]})">
        <span class="kaart-icoon">${ikoon(d.icoon, 26)}</span>
        <h3>${escapeHtml(d.titel).toUpperCase()}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.licht};color:${sj.kleur1}}
header{display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:999px;margin:1rem 1.5rem;padding:.8rem 1.6rem;box-shadow:0 2px 10px rgba(0,0,0,.06)}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:.95rem}
.merk-logo{background:${sj.kleur1};color:#fff;font-weight:900;border-radius:.4rem;padding:.3rem .55rem;font-size:.9rem}
.pil{background:${sj.accent};color:#fff;font-weight:700;border-radius:.6rem;padding:.65rem 1.3rem;font-size:.85rem}
.held{display:grid;grid-template-columns:1.1fr .9fr;gap:2rem;align-items:center;max-width:74rem;margin:0 auto;padding:3rem 2rem}
.held h1{font-size:clamp(2.2rem,6.5vw,4.2rem);font-weight:900;text-transform:uppercase;line-height:1.02;letter-spacing:-.01em}
.held .sub{margin-top:1.2rem;font-size:1.05rem;color:${sj.kleur1}cc;max-width:30rem}
.usp-lijst{margin-top:1.4rem;display:grid;gap:.5rem;font-weight:700;font-size:.9rem;text-transform:uppercase;letter-spacing:.02em}
.usp-lijst span{display:flex;align-items:center;gap:.5rem}
.usp-lijst svg{color:${sj.accent}}
.knop{display:inline-block;margin-top:1.6rem;background:${sj.accent};color:#fff;font-weight:800;padding:.95rem 1.9rem;border-radius:.6rem;text-decoration:none;text-transform:uppercase;font-size:.9rem}
.held-vlak{position:relative;aspect-ratio:4/3;border-radius:1rem;overflow:hidden;transform:rotate(2deg);box-shadow:0 18px 40px rgba(0,0,0,.18)}
.werk{max-width:74rem;margin:0 auto;padding:1.5rem 2rem 3.5rem}
.werk h2{font-size:1.5rem;font-weight:900;text-transform:uppercase;text-align:center}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1.6rem;margin-top:2.2rem}
.kaart{background:#fff;border-radius:.9rem;padding:1.6rem;box-shadow:0 10px 26px rgba(0,0,0,.1)}
.kaart-icoon{color:${sj.accent}}
.kaart h3{margin-top:.7rem;font-weight:900;font-size:1rem;letter-spacing:.03em}
.kaart p{margin-top:.5rem;color:${sj.kleur1}b3;font-size:.9rem}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3.2rem 1.5rem;border-radius:1.4rem 1.4rem 0 0}
.cta h2{font-size:1.7rem;font-weight:900;text-transform:uppercase}
.cta p{margin-top:.6rem;opacity:.8}
footer{background:${sj.kleur1};color:#fff9;padding:0 0 1.4rem;text-align:center;font-size:.8rem}
@media(max-width:700px){.held{grid-template-columns:1fr}}`;

  const body = `
  <header>
    <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")}${escapeHtml(bedrijf)}</span>
    <span class="pil">${escapeHtml(sj.ctaKnop)}</span>
  </header>
  <section class="held">
    <div>
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p class="sub">${escapeHtml(sj.subtitel)}</p>
      <div class="usp-lijst">${sj.usps.map((u) => `<span>${ikoon("vink", 17)} ${escapeHtml(u)}</span>`).join("")}</div>
      <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
    </div>
    <div class="held-vlak">${beeldOfPatroon(sj, echt, 1)}</div>
  </section>
  <section class="werk">
    <h2>Wat we maken</h2>
    <div class="kaarten">${kaarten}</div>
  </section>
  <section class="cta" id="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ MINIMAL (Scandinavisch) ====================== */

function minimalWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const rijen = sj.diensten
    .map(
      (d, i) => `<div class="rij">
        <span class="rij-nr">0${i + 1}</span>
        <div class="rij-tekst"><h3>${escapeHtml(d.titel)}</h3><p>${escapeHtml(d.omschrijving)}</p></div>
        <span class="rij-icoon">${ikoon(d.icoon, 22)}</span>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#1a1a1a}
header{display:flex;justify-content:space-between;align-items:center;padding:1.6rem 2.5rem;font-size:.85rem;letter-spacing:.12em;text-transform:uppercase}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:600}
.merk-logo{border:1px solid #1a1a1a;font-weight:700;padding:.3rem .5rem;font-size:.85rem}
nav{display:flex;gap:1.8rem;color:#8a8a8a}
.held{max-width:62rem;margin:0 auto;padding:5.5rem 2.5rem 4rem}
.held h1{font-size:clamp(2.2rem,6vw,4rem);font-weight:300;line-height:1.12;max-width:38rem}
.held h1 b{font-weight:700}
.held p{margin-top:1.4rem;color:#6b6b6b;max-width:30rem;font-size:1.02rem;line-height:1.7}
.knop{display:inline-block;margin-top:2rem;color:#1a1a1a;font-weight:600;text-decoration:none;border-bottom:2px solid ${sj.accent};padding-bottom:.25rem;letter-spacing:.04em;text-transform:uppercase;font-size:.85rem}
.beeld{max-width:62rem;margin:0 auto;padding:0 2.5rem}
.beeld-vlak{position:relative;aspect-ratio:5/2;overflow:hidden}
.lijst{max-width:62rem;margin:0 auto;padding:3.5rem 2.5rem}
.rij{display:flex;align-items:center;gap:1.6rem;border-top:1px solid #e8e8e8;padding:1.6rem 0}
.rij:last-child{border-bottom:1px solid #e8e8e8}
.rij-nr{font-size:.8rem;color:#b3b3b3;font-weight:600;width:2rem}
.rij-tekst{flex:1}
.rij-tekst h3{font-size:1.1rem;font-weight:600}
.rij-tekst p{margin-top:.3rem;color:#6b6b6b;font-size:.92rem;max-width:34rem}
.rij-icoon{color:${sj.accent}}
.usps{max-width:62rem;margin:0 auto;padding:0 2.5rem 3rem;display:flex;flex-wrap:wrap;gap:2rem;color:#8a8a8a;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase}
.cta{border-top:1px solid #e8e8e8;text-align:center;padding:4rem 2rem}
.cta h2{font-weight:300;font-size:1.8rem}
.cta p{margin-top:.7rem;color:#6b6b6b}
footer{padding:1.6rem;text-align:center;font-size:.8rem;color:#b3b3b3}`;

  const body = `
  <header>
    <span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo")}${escapeHtml(bedrijf)}</span>
    <nav>${menuItems(echt, ["Werk", "Diensten", "Contact"])}</nav>
  </header>
  <section class="held">
    <h1><b>${escapeHtml(sj.tagline)}.</b><br>${escapeHtml(bedrijf)}${plaats ? `, ${escapeHtml(plaats)}` : ""}.</h1>
    <p>${escapeHtml(sj.subtitel)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <div class="beeld"><div class="beeld-vlak">${beeldOfPatroon(sj, echt, 1)}</div></div>
  <section class="lijst">${rijen}</section>
  <div class="usps">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ KLASSIEK (serif chic) ======================== */

function klassiekWebsite({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="kaart">
        <span class="kaart-icoon">${ikoon(d.icoon, 24)}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const goud = "#a8894e";

  const css = `
body{font-family:${FONT_SERIF};background:#f7f4ee;color:#2b2620}
header{text-align:center;padding:2.2rem 1.5rem 1.4rem}
.merk{display:inline-flex;flex-direction:column;align-items:center;gap:.5rem;font-size:1.3rem;letter-spacing:.14em;text-transform:uppercase}
.merk-logo{border:1px solid ${goud};color:${goud};padding:.4rem .7rem;font-size:1rem;letter-spacing:.1em}
nav{display:flex;justify-content:center;gap:2.2rem;padding:.8rem 1rem 1.6rem;font-family:${FONT_SANS};font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#7a7266}
.haarlijn{width:6rem;height:1px;background:${goud};margin:0 auto}
.held{text-align:center;max-width:46rem;margin:0 auto;padding:3.5rem 2rem}
.held h1{font-size:clamp(2rem,5.5vw,3.4rem);font-weight:400;line-height:1.15;font-style:italic}
.held p{margin-top:1.3rem;color:#5f574b;font-size:1.05rem;line-height:1.8}
.knop{display:inline-block;margin-top:2rem;border:1px solid #2b2620;color:#2b2620;font-family:${FONT_SANS};font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;padding:.95rem 2.2rem;text-decoration:none}
.beeld{max-width:56rem;margin:0 auto;padding:0 2rem}
.beeld-vlak{position:relative;aspect-ratio:16/7;overflow:hidden}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:2.4rem;max-width:66rem;margin:0 auto;padding:3.5rem 2rem;text-align:center}
.kaart-icoon{color:${goud}}
.kaart h3{margin-top:.9rem;font-size:1.15rem;font-weight:400}
.kaart p{margin-top:.6rem;color:#5f574b;font-size:.92rem;line-height:1.7}
.usps{text-align:center;padding:0 2rem 3rem;font-family:${FONT_SANS};font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#7a7266;display:flex;flex-wrap:wrap;justify-content:center;gap:1.8rem}
.cta{background:${sj.kleur1};color:#f3efe7;text-align:center;padding:3.6rem 2rem}
.cta h2{font-size:1.7rem;font-weight:400;font-style:italic}
.cta p{margin-top:.7rem;opacity:.8}
.cta .knop{border-color:${goud};color:${goud}}
footer{padding:1.6rem;text-align:center;font-family:${FONT_SANS};font-size:.75rem;letter-spacing:.1em;color:#a39a8b}`;

  const body = `
  <header><span class="merk">${merkOfBadge(echt, bedrijf, "merk-logo", "2.4rem")}${escapeHtml(bedrijf)}</span></header>
  <nav>${menuItems(echt, ["Diensten", "Over ons", "Contact"])}</nav>
  <div class="haarlijn"></div>
  <section class="held">
    <h1>${escapeHtml(sj.tagline)}</h1>
    <p>${escapeHtml(sj.subtitel)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <div class="beeld"><div class="beeld-vlak">${beeldOfPatroon(sj, echt, 1)}</div></div>
  <section class="kaarten">${kaarten}</section>
  <div class="usps">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join(`<span aria-hidden="true" style="color:${goud}">·</span>`)}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ================================ APP-MOCKUP ============================== */

function appMockup({ bedrijf, plaats, sj, echt }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="app-kaart">
        <span class="app-icoon">${ikoon(d.icoon, 22)}</span>
        <div><h3>${escapeHtml(d.titel)}</h3><p>${escapeHtml(d.omschrijving)}</p></div>
        <span class="app-pijl">›</span>
      </article>`,
    )
    .join("\n");

  const donker = sj.stijl === "horeca" || sj.stijl === "premium" || sj.stijl === "tech";

  const css = `
body{margin:0;background:#e6e9ee;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:${FONT_SANS}}
.telefoon{width:360px;max-width:92vw;height:720px;max-height:92vh;background:#0b0f14;border-radius:2.5rem;padding:.6rem;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.scherm{background:${donker ? sj.kleur1 : "#f4f6f9"};border-radius:2rem;height:100%;overflow-y:auto;display:flex;flex-direction:column;color:${donker ? "#f5efe6" : "#101828"}}
.app-kop{background:linear-gradient(150deg,${sj.kleur1},${sj.kleur2});color:#fff;border-radius:2rem 2rem 1.4rem 1.4rem;padding:2.4rem 1.4rem 1.8rem;text-align:center}
.app-logo{display:inline-flex;background:rgba(255,255,255,.15);border-radius:1rem;width:3.4rem;height:3.4rem;align-items:center;justify-content:center;font-weight:900;font-size:1.2rem}
.app-kop h1{margin-top:.8rem;font-size:1.35rem;font-weight:800}
.app-kop p{margin-top:.4rem;font-size:.85rem;opacity:.8}
.app-cta{display:inline-block;margin-top:1.1rem;background:${sj.accent};color:#fff;font-weight:700;font-size:.85rem;padding:.65rem 1.4rem;border-radius:999px;text-decoration:none}
.app-body{flex:1;padding:1.1rem}
.app-body h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin:0 0 .7rem .2rem}
.app-kaart{display:flex;align-items:center;gap:.9rem;background:${donker ? "rgba(255,255,255,.07)" : "#fff"};border-radius:1rem;padding:.95rem;margin-bottom:.7rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.app-icoon{color:${sj.accent};flex:none}
.app-kaart h3{font-size:.92rem;margin:0}
.app-kaart p{font-size:.75rem;opacity:.65;margin:.15rem 0 0}
.app-pijl{margin-left:auto;opacity:.4;font-size:1.2rem}
.tabbar{display:flex;justify-content:space-around;align-items:center;background:${donker ? "rgba(255,255,255,.06)" : "#fff"};border-top:1px solid rgba(0,0,0,.06);padding:.8rem 0 1.1rem;border-radius:0 0 2rem 2rem}
.tabbar span{opacity:.4}
.tabbar span:first-child{opacity:1;color:${sj.accent}}`;

  const body = `
  <div class="telefoon"><div class="scherm">
    <header class="app-kop"${heroAchtergrond(sj, echt, 150)}>
      ${merkOfBadge(echt, bedrijf, "app-logo", "2.2rem")}
      <h1>${escapeHtml(bedrijf)}</h1>
      <p>${escapeHtml(sj.tagline)}${plaats ? ` · ${escapeHtml(plaats)}` : ""}</p>
      <a class="app-cta" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </header>
    <div class="app-body">
      <h2>Wat we doen</h2>
      ${kaarten}
    </div>
    <nav class="tabbar"><span>${ikoon("huis", 21)}</span><span>${ikoon(sj.diensten[0]?.icoon ?? "ster", 21)}</span><span>${ikoon("gesprek", 21)}</span><span>${ikoon("persoon", 21)}</span></nav>
  </div></div>`;

  return wrap(`${escapeHtml(bedrijf)} — app-prototype`, css, body);
}

/* ================================ PUBLIEK ================================= */

/**
 * Bouwt direct (0 tokens) een prototype-pagina.
 * - `branche` bepaalt de inhoud (diensten, teksten, USP's).
 * - `stijl` (optioneel) kiest het design system, los van de branche; zonder
 *   deze parameter kiest de branche zijn standaardstijl.
 * - `echt` (optioneel) is de huisstijl van de klant zelf, opgehaald van hun
 *   URL (lib/site-scrape.ts): logo, merkkleur, foto en omschrijving — allemaal
 *   zonder AI, dus 0 tokens.
 */
export function bouwStatischPrototype(input: {
  bedrijf: string;
  plaats: string | null;
  branche: string | null;
  type: PrototypeType;
  stijl?: DesignStijl | null;
  echt?: EchtContent | null;
}): string {
  const basisSjabloon = sjabloonVoor(input.branche);
  const metStijl: Sjabloon = input.stijl ? { ...basisSjabloon, stijl: input.stijl } : basisSjabloon;
  const basis = metHuisstijl(metStijl, input.echt);
  const sj = metEchteTeksten(basis, input.echt);
  const invoer: Invoer = {
    bedrijf: input.bedrijf,
    plaats: input.plaats,
    sj,
    echt: input.echt ?? undefined,
  };

  if (input.type === "app") return appMockup(invoer);

  switch (sj.stijl) {
    case "webshop":
      return webshopWebsite(invoer);
    case "premium":
      return premiumWebsite(invoer);
    case "horeca":
      return horecaWebsite(invoer);
    case "corporate":
      return corporateWebsite(invoer);
    case "verhaal":
      return verhaalWebsite(invoer);
    case "tech":
      return techWebsite(invoer);
    case "vastgoed":
      return vastgoedWebsite(invoer);
    case "studio":
      return studioWebsite(invoer);
    case "minimal":
      return minimalWebsite(invoer);
    case "klassiek":
      return klassiekWebsite(invoer);
  }
}
