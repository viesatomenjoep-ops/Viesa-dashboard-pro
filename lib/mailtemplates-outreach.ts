/**
 * 25 outreach-sjablonen voor het benaderen van leads.
 *
 * Geen 25 losse mails, maar vijf sequenties die op elkaar aansluiten:
 *
 *   A. Koude opening (1–7)      — eerste aanraking, koud
 *   B. Waarde vooraf (8–12)     — iets weggeven vóór je iets vraagt
 *   C. Opvolging (13–17)        — de reeks na stilte
 *   D. Na het gesprek (18–22)   — bevestigen, voorstellen, doorpakken
 *   E. Bezwaren & warm (23–25)  — het gesprek weer openbreken
 *
 * Schrijfregels die in elk sjabloon zijn toegepast:
 *
 *   - Eén vraag per mail. Twee vragen is nul antwoorden.
 *   - De eerste zin gaat over hén, nooit over ons.
 *   - Geen "wij zijn een jong en dynamisch bedrijf", geen "ik hoop dat deze
 *     mail u goed bereikt", geen "graag zou ik vrijblijvend".
 *   - Kort. Een koude mail die niet op één telefoonscherm past, wordt niet
 *     gelezen.
 *   - De vraag aan het eind is klein: een "ja", niet een uur in de agenda.
 *
 * Variabelen: {{voornaam}} {{bedrijf}} {{website}} {{stad}}. Alles tussen
 * blokhaken — [zoals dit] — vul je met de hand in vóór verzenden; dat is
 * bewust, want juist dat detail maakt het verschil tussen persoonlijk en
 * massaal.
 */

export type OutreachTemplate = {
  key: string;
  naam: string;
  onderwerp: string;
  tekst: string;
};

const GROET =
  "Met vriendelijke groet,\nTom van Biene\nViesa Automations\nwww.viesa-automations.nl";

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  // ==========================================================================
  // A · Koude opening
  // ==========================================================================
  {
    key: "oa_observatie",
    naam: "A1 · De ene observatie",
    onderwerp: "Iets wat me opviel op {{website}}",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik was op {{website}} en zag [concrete observatie — bv. dat jullie bestellingen per e-mail binnenkomen]. Dat is precies het soort ding waar wij ons dagelijks mee bezighouden.\n\n" +
      "Wij bouwen voor webshops en groothandels de koppelingen die dat handwerk wegnemen. Geen nieuw systeem, maar de systemen die je al hebt met elkaar laten praten.\n\n" +
      "Speelt dit bij {{bedrijf}}, of zit het al goed?\n\n" +
      GROET,
  },
  {
    key: "oa_cijfer",
    naam: "A2 · Het cijfer",
    onderwerp: "[X] seconden — en wat dat {{bedrijf}} kost",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik heb {{website}} even door een snelheidstest gehaald. Op mobiel laadt de pagina in [X] seconden.\n\n" +
      "Dat klinkt onschuldig, maar de vuistregel is hard: elke seconde erbij kost ongeveer een vijfde van je conversie. Bij jullie volume praat je dan al snel over serieus geld per jaar.\n\n" +
      "Ik heb de meting en de drie oorzaken op een rijtje. Zal ik ze sturen?\n\n" +
      GROET,
  },
  {
    key: "oa_branchegenoot",
    naam: "A3 · De branchegenoot",
    onderwerp: "Wat een [branche]-collega vorig kwartaal deed",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "We werken voor een aantal bedrijven in [branche]. Bij vrijwel allemaal kwam hetzelfde naar boven: de webshop draait prima, maar erachter wordt nog veel overgetikt tussen shop, voorraad en boekhouding.\n\n" +
      "Bij [type bedrijf] hebben we dat vorig kwartaal dichtgezet. Resultaat: [concreet resultaat, bv. 6 uur per week terug en geen voorraadfouten meer].\n\n" +
      "Herkenbaar bij {{bedrijf}}? Dan is het gesprek de moeite waard.\n\n" +
      GROET,
  },
  {
    key: "oa_een_vraag",
    naam: "A4 · Eén vraag, tien seconden",
    onderwerp: "Eén vraag over {{bedrijf}}",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Eén vraag, tien seconden werk:\n\n" +
      "Staat het automatiseren van jullie orderverwerking dit jaar op de planning?\n\n" +
      "Ja → dan stuur ik je iets bruikbaars.\nNee → dan hoor je niets meer van me.\n\n" +
      GROET,
  },
  {
    key: "oa_signaal",
    naam: "A5 · Het signaal",
    onderwerp: "Gezien: [signaal] bij {{bedrijf}}",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik zag [signaal — bv. jullie vacature voor een orderverwerker / de overstap naar een nieuw platform / het nieuws over jullie uitbreiding]. Gefeliciteerd — en meteen een gedachte.\n\n" +
      "Precies op zo'n moment wordt zichtbaar welk werk eigenlijk niet door een mens gedaan hoeft te worden. Wij bouwen dat soort koppelingen, vaak binnen enkele weken.\n\n" +
      "Zou het nuttig zijn om er kort over te sparren voordat jullie het anders inrichten?\n\n" +
      GROET,
  },
  {
    key: "oa_toestemming",
    naam: "A6 · Toestemming vragen",
    onderwerp: "Mag ik je iets sturen?",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik ga je niets verkopen in deze mail. Ik wil alleen iets vragen.\n\n" +
      "Wij hebben een korte scan waarmee we van buitenaf zien waar bij een webshop tijd en omzet weglekt — laadtijd, mobiele afrekenroute, handmatige stappen in de backoffice. Kost jou niets en duurt bij ons een half uur.\n\n" +
      "Mag ik die voor {{bedrijf}} doen en de uitkomst sturen? Eén woord terug is genoeg.\n\n" +
      GROET,
  },
  {
    key: "oa_omgekeerd",
    naam: "A7 · De omgekeerde pitch",
    onderwerp: "Waarschijnlijk niets voor {{bedrijf}}",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Eerlijk: wij zijn niet voor iedereen. Wat wij doen loont pas als er echt volume doorheen gaat en er nog mensen handmatig zitten over te tikken.\n\n" +
      "Bij minder dan [aantal] orders per maand verdien je ons niet terug. Dan zeggen we dat gewoon.\n\n" +
      "Maar zit {{bedrijf}} daarboven, dan is het gesprek waarschijnlijk wél de moeite waard. Hoe zit dat bij jullie?\n\n" +
      GROET,
  },

  // ==========================================================================
  // B · Waarde vooraf
  // ==========================================================================
  {
    key: "oa_drie_dingen",
    naam: "B1 · Drie dingen die ik zag",
    onderwerp: "3 dingen die ik zag op {{website}}",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik heb een half uur naar {{website}} gekeken. Drie dingen vielen op:\n\n" +
      "• [Bevinding 1 — concreet, met de pagina erbij]\n" +
      "• [Bevinding 2]\n" +
      "• [Bevinding 3]\n\n" +
      "De eerste kost jullie waarschijnlijk het meest, en is het snelst op te lossen.\n\n" +
      "Wil je dat ik uitleg hoe? Dan bel ik je een kwartier — verder niets.\n\n" +
      GROET,
  },
  {
    key: "oa_bevinding",
    naam: "B2 · De ongevraagde bevinding",
    onderwerp: "Jullie afrekenpagina doet iets geks op mobiel",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik wilde even kijken hoe {{website}} op mobiel bestelt, en liep tegen iets aan: [concreet probleem — bv. de betaalknop valt onder de toetsenbalk op iPhone].\n\n" +
      "Ik heb er een schermafbeelding van. Als dit bij meer bezoekers gebeurt, verlies je afrekeningen zonder dat je het in je cijfers terugziet — die mensen komen namelijk nooit tot de bedanktpagina.\n\n" +
      "Zal ik 'm sturen? Kost je niets, ook als je verder niets met ons doet.\n\n" +
      GROET,
  },
  {
    key: "oa_benchmark",
    naam: "B3 · De benchmark",
    onderwerp: "{{bedrijf}} naast negen concurrenten gelegd",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "We hebben voor onszelf in kaart gebracht hoe de webshops in [branche] presteren op laadtijd, mobiele afrekenroute en zoekfunctie. {{bedrijf}} zit daar ook bij.\n\n" +
      "Kort samengevat: op [punt] staan jullie duidelijk bovenaan. Op [ander punt] loopt de middenmoot voor.\n\n" +
      "Geen namen van anderen natuurlijk, maar de cijfers en jullie eigen positie deel ik graag. Interesse?\n\n" +
      GROET,
  },
  {
    key: "oa_rekensom",
    naam: "B4 · De rekensom",
    onderwerp: "Wat zes uur overtypen per week kost",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Even een rekensom die bij veel bedrijven zoals {{bedrijf}} opgaat.\n\n" +
      "Stel: iemand is zes uur per week bezig met orders overzetten tussen systemen. Dat is bijna een volle werkdag, elke week. Op jaarbasis ruim 300 uur — plus de fouten die er onvermijdelijk insluipen.\n\n" +
      "Zo'n koppeling bouwen kost eenmalig een fractie daarvan en draait daarna vanzelf.\n\n" +
      "Klopt die zes uur ongeveer bij jullie, of zit ik ernaast?\n\n" +
      GROET,
  },
  {
    key: "oa_weggever",
    naam: "B5 · De weggever",
    onderwerp: "Onze checklist: 12 processen die zichzelf kunnen doen",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "We hebben opgeschreven welke twaalf processen we bij webshops en groothandels het vaakst automatiseren — van orderbevestiging tot voorraadsync en incasso-opvolging.\n\n" +
      "Per proces staat erbij wat het gemiddeld aan tijd bespaart en hoe ingewikkeld het is om te bouwen. Handig als naslag, ook als je het zelf oppakt.\n\n" +
      "Zal ik 'm sturen? Geen formulier, gewoon een reply.\n\n" +
      GROET,
  },

  // ==========================================================================
  // C · Opvolging
  // ==========================================================================
  {
    key: "oa_nieuwe_hoek",
    naam: "C1 · Nieuwe invalshoek",
    onderwerp: "Nog één invalshoek",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik kwam nog iets tegen dat interessanter is dan wat ik je vorige week schreef.\n\n" +
      "[Nieuwe invalshoek — een andere kans, een concreet cijfer, iets uit hun branche.]\n\n" +
      "Als dit ook niets is, laat het gerust weten. Dan houd ik erover op.\n\n" +
      GROET,
  },
  {
    key: "oa_bewijs",
    naam: "C2 · Het bewijs",
    onderwerp: "Hoe [klant] dit oploste",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Misschien werkt een voorbeeld beter dan mijn uitleg.\n\n" +
      "[Klant], vergelijkbaar met {{bedrijf}}, zat met [probleem]. We hebben [ingreep] gebouwd. Sindsdien [resultaat, met een getal].\n\n" +
      "Van eerste gesprek tot live: [doorlooptijd].\n\n" +
      "Zou datzelfde bij jullie werken, denk je?\n\n" +
      GROET,
  },
  {
    key: "oa_juiste_persoon",
    naam: "C3 · Ben jij de juiste?",
    onderwerp: "Ben jij hiervoor de juiste?",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik heb je een paar keer gemaild over het automatiseren van de processen achter jullie webshop, maar krijg geen reactie. Goed mogelijk dat ik gewoon bij de verkeerde persoon aanklop.\n\n" +
      "Wie houdt zich bij {{bedrijf}} bezig met de systemen en koppelingen? Als je me de naam geeft, val ik jou verder niet meer lastig.\n\n" +
      GROET,
  },
  {
    key: "oa_afsluiter",
    naam: "C4 · De nette afsluiter",
    onderwerp: "Ik stop met mailen",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Dit is mijn laatste bericht — ik blijf niet aan je trekken.\n\n" +
      "Mocht het automatiseren van jullie backoffice later toch gaan spelen, dan weet je me te vinden. Ik reageer altijd, ook over een jaar.\n\n" +
      "Succes met {{bedrijf}}.\n\n" +
      GROET,
  },
  {
    key: "oa_halfjaar",
    naam: "C5 · Een halfjaar later",
    onderwerp: "Een halfjaar later",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "We spraken elkaar ongeveer een halfjaar geleden. Toen was het geen goed moment — helder, dat gebeurt.\n\n" +
      "Sindsdien is er wel wat veranderd: [wat er veranderde — bij ons, in hun markt, of in de techniek]. Daardoor is [onderwerp] nu een stuk sneller en goedkoper te doen dan toen.\n\n" +
      "Is het inmiddels wél een goed moment om er even naar te kijken?\n\n" +
      GROET,
  },

  // ==========================================================================
  // D · Na het gesprek
  // ==========================================================================
  {
    key: "oa_afspraak",
    naam: "D1 · Afspraak vastgelegd",
    onderwerp: "Bevestigd: [datum] om [tijd]",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Genoteerd: [datum] om [tijd], via [videobellen/telefoon/bij jullie op kantoor]. Reken op drie kwartier.\n\n" +
      "Om er meteen wat uit te halen, twee dingen die me helpen:\n\n" +
      "• Welk proces kost jullie op dit moment de meeste tijd?\n" +
      "• Welke systemen gebruiken jullie nu (webshop, voorraad, boekhouding)?\n\n" +
      "Een paar steekwoorden is genoeg — dan kom ik voorbereid.\n\n" +
      "Tot [dag]!\n\n" +
      GROET,
  },
  {
    key: "oa_verslag",
    naam: "D2 · Wat we afspraken",
    onderwerp: "Wat we afspraken",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Bedankt voor het gesprek. Even vastleggen wat we bespraken, dan weten we het allebei nog:\n\n" +
      "• Grootste knelpunt: [knelpunt]\n" +
      "• Wat het jullie nu kost: [tijd of geld]\n" +
      "• Richting die we voorstelden: [richting]\n\n" +
      "Ik pak [onze actie] op en kom uiterlijk [datum] bij je terug. Jij zou [hun actie] nakijken.\n\n" +
      "Klopt dit met jouw beeld van het gesprek?\n\n" +
      GROET,
  },
  {
    key: "oa_voorstel",
    naam: "D3 · Het voorstel begeleiden",
    onderwerp: "Je voorstel — en waarom deze volgorde",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Hierbij het voorstel voor {{bedrijf}}. Eén ding vooraf, want dat is belangrijker dan het bedrag onderaan: de volgorde.\n\n" +
      "We beginnen bewust met [eerste stap]. Niet omdat dat het grootste is, maar omdat het het snelst iets oplevert — en omdat we daarmee bewijzen dat de rest ook klopt. Pas daarna [tweede stap].\n\n" +
      "Zo loop je nooit maanden vooruit te betalen op iets wat je nog niet hebt zien werken.\n\n" +
      "Ik hoor graag wat je van die opbouw vindt.\n\n" +
      GROET,
  },
  {
    key: "oa_bezwaar_vragen",
    naam: "D4 · Wat houdt je tegen?",
    onderwerp: "Wat houdt je tegen?",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Ik ga je niet vragen of je het voorstel al hebt kunnen bekijken — dat helpt ons allebei niet verder.\n\n" +
      "Betere vraag: wat is het onderdeel waar je het minst zeker over bent? De prijs, de doorlooptijd, of of het technisch gaat werken met jullie huidige systemen?\n\n" +
      "Zeg maar welke van de drie het is, dan pak ik precies dat op.\n\n" +
      GROET,
  },
  {
    key: "oa_parkeren",
    naam: "D5 · De parkeerstand",
    onderwerp: "Ik zet 'm op [maand]",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Helder dat het nu niet uitkomt. Ik zet het bij ons op [maand] en neem dan opnieuw contact op — geen gemail tussendoor.\n\n" +
      "Eén ding wil ik nog weten, zodat dat gesprek meteen ergens over gaat: wat moet er tegen die tijd anders zijn wil dit wél kunnen? Budget rond, iemand vrijgemaakt, of eerst [ander project] afronden?\n\n" +
      GROET,
  },

  // ==========================================================================
  // E · Bezwaren & warme lijnen
  // ==========================================================================
  {
    key: "oa_naast_bureau",
    naam: "E1 · Naast, niet in plaats van",
    onderwerp: "Niet in plaats van jullie bureau",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Je gaf aan dat jullie al met [partij] werken. Prima — daar willen we ook niet tussen gaan zitten.\n\n" +
      "Wat wij doen zit meestal ergens anders: niet de webshop zelf, maar alles erachter. De koppelingen tussen shop, voorraad en boekhouding, en het handwerk dat daar nog omheen zit. De meeste bureaus doen dat niet, en dat is geen kritiek — het is gewoon een ander vak.\n\n" +
      "Zullen we een kwartier bellen om te kijken of er overlap is? Zo niet, dan weet je dat ook.\n\n" +
      GROET,
  },
  {
    key: "oa_kleiner",
    naam: "E2 · Kleiner beginnen",
    onderwerp: "Kleiner beginnen kan ook",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "Je vond het bedrag te hoog. Terecht om dat te zeggen — en het hoeft ook niet in één keer.\n\n" +
      "We kunnen beginnen met alleen [kleinste afgebakende blok], voor [vast bedrag]. Dat staat op zichzelf, levert direct [concreet resultaat] op, en je zit nergens aan vast.\n\n" +
      "Bevalt het, dan pakken we de rest. Bevalt het niet, dan heb je in elk geval dat ene stuk werkend.\n\n" +
      "Zullen we het zo doen?\n\n" +
      GROET,
  },
  {
    key: "oa_doorverwijzing",
    naam: "E3 · De doorverwijzing",
    onderwerp: "[verwijzer] zei dat ik je moest mailen",
    tekst:
      "Beste {{voornaam}},\n\n" +
      "[Verwijzer] noemde jouw naam. We hebben voor [hem/haar/hen] [wat we deden] gebouwd, en het gesprek kwam op {{bedrijf}} — volgens [verwijzer] speelt bij jullie iets vergelijkbaars met [onderwerp].\n\n" +
      "Klopt dat? Dan bel ik je graag een kwartier. En zo niet, dan hoor ik het net zo graag.\n\n" +
      GROET,
  },
];
