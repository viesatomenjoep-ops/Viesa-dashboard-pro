/**
 * 25 offertesjablonen.
 *
 * Vijf blokken, elk vijf offertes:
 *
 *   A. Koppelingen & integraties (1–5)
 *   B. Webshop & e-commerce (6–10)
 *   C. Backoffice-automatisering (11–15)
 *   D. Websites & portalen (16–20)
 *   E. Onderhoud & doorlopende diensten (21–25)
 *
 * Elke offerte heeft dezelfde opbouw, en die volgorde is bewust:
 *
 *   1. Wat we begrepen hebben  — laat zien dat je geluisterd hebt, in hún woorden
 *   2. Wat we voorstellen      — de oplossing, in stappen
 *   3. Wat het oplevert        — waarom dit geld waard is
 *   4. Investering             — pas nu het bedrag, als het waarom al staat
 *   5. Doorlooptijd            — wanneer ze het hebben
 *   6. Wat we van jullie nodig hebben — voorkomt vertraging én verrassingen
 *
 * Alles tussen blokhaken — [zoals dit] — vul je per klant in. De {{variabelen}}
 * worden automatisch gevuld met de gegevens van de gekozen klant.
 */

export type OfferteSjabloon = {
  key: string;
  naam: string;
  inhoud_html: string;
};

type Sectie = {
  kop: string;
  tekst?: string;
  punten?: string[];
  genummerd?: string[];
};

/** Bouwt de HTML van een offerte uit secties — houdt de sjablonen leesbaar. */
function doc(intro: string, secties: Sectie[]): string {
  const delen = [`<p>${intro}</p>`];
  for (const s of secties) {
    delen.push(`<h2>${s.kop}</h2>`);
    if (s.tekst) delen.push(`<p>${s.tekst}</p>`);
    if (s.punten) delen.push(`<ul>${s.punten.map((p) => `<li>${p}</li>`).join("")}</ul>`);
    if (s.genummerd)
      delen.push(`<ol>${s.genummerd.map((p) => `<li>${p}</li>`).join("")}</ol>`);
  }
  delen.push(
    `<p>Met vriendelijke groet,<br>Tom van Biene &amp; Joep Hellemons — Viesa Automations</p>`,
  );
  return delen.join("");
}

const INTRO = "Beste {{voornaam}},";

/** De vaste staartsecties die elke offerte afsluiten. */
function staart(
  investering: string[],
  doorlooptijd: string,
  nodig: string[],
): Sectie[] {
  return [
    {
      kop: "Investering",
      punten: investering,
      tekst:
        "Alle bedragen zijn exclusief btw. De offerte is dertig dagen geldig.",
    },
    { kop: "Doorlooptijd", tekst: doorlooptijd },
    {
      kop: "Wat we van jullie nodig hebben",
      tekst: "Om de planning te halen hebben we dit van jullie kant nodig:",
      punten: nodig,
    },
  ];
}

export const OFFERTE_SJABLONEN: OfferteSjabloon[] = [
  // ==========================================================================
  // A · Koppelingen & integraties
  // ==========================================================================
  {
    key: "off_shop_boekhouding",
    naam: "A1 · Koppeling webshop → boekhouding",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Bij {{bedrijf}} worden bestellingen uit de webshop met de hand overgezet naar de boekhouding. Dat kost ongeveer [X] uur per week, en er sluipen fouten in die pas bij de btw-aangifte opvallen.",
      },
      {
        kop: "Wat we voorstellen",
        tekst: "Een koppeling die dat overtikken volledig overneemt:",
        genummerd: [
          "Elke betaalde bestelling gaat automatisch als verkoopfactuur naar [boekhoudpakket].",
          "Btw-tarieven worden per regel meegenomen, ook bij gemengde bestellingen en buitenlandse leveringen.",
          "Retouren en creditnota's lopen dezelfde weg terug.",
          "Mislukt er iets, dan krijg je een melding met de bestelling erbij — geen stille fouten.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "[X] uur per week terug, elke week",
          "Geen overtypfouten meer in je omzetcijfers",
          "Altijd actuele cijfers, ook halverwege de maand",
        ],
      },
      ...staart(
        [
          "Bouw en inrichting koppeling — [bedrag]",
          "Testen met jullie eigen bestellingen — inbegrepen",
          "Overdracht en documentatie — inbegrepen",
        ],
        "[X] weken na akkoord, waarvan de laatste week meedraaien naast jullie huidige werkwijze.",
        [
          "Toegang tot de webshop-beheeromgeving",
          "Een API-sleutel of gebruiker voor [boekhoudpakket]",
          "Eén contactpersoon die de boekhouding kent",
        ],
      ),
    ]),
  },
  {
    key: "off_voorraadsync",
    naam: "A2 · Voorraadsynchronisatie",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "De voorraad in de webshop van {{bedrijf}} loopt achter op de werkelijke voorraad. Gevolg: verkopen van producten die er niet zijn, en klanten die achteraf bericht krijgen dat hun bestelling niet doorgaat.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een tweerichtingskoppeling tussen [voorraadsysteem] en de webshop.",
          "Voorraad wordt elke [interval] bijgewerkt, en direct bij een verkoop.",
          "Een instelbare buffer per product, zodat hardlopers niet op nul verkopen.",
          "Een dagelijks overzicht van producten waar het verschil te groot werd.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Geen nabellen meer over bestellingen die niet geleverd kunnen worden",
          "Minder handmatige voorraadcorrecties",
          "Betrouwbare cijfers om op in te kopen",
        ],
      },
      ...staart(
        ["Koppeling en bufferlogica — [bedrag]", "Inregelen per productgroep — [bedrag]"],
        "[X] weken, inclusief een proefperiode op een deel van het assortiment.",
        [
          "Toegang tot [voorraadsysteem]",
          "Een lijst met producten waarvoor een afwijkende buffer geldt",
        ],
      ),
    ]),
  },
  {
    key: "off_pakketdienst",
    naam: "A3 · Koppeling met de pakketdienst",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Verzendlabels worden bij {{bedrijf}} per bestelling met de hand aangemaakt, en track-en-tracecodes worden apart naar de klant gestuurd.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Labels worden automatisch aangemaakt zodra een bestelling verzendklaar staat.",
          "De track-en-tracecode gaat vanzelf terug naar de webshop én naar de klant.",
          "Verzendmethode wordt gekozen op gewicht, land en gekozen leveroptie.",
          "Een dagoverzicht van zendingen die vastlopen bij de vervoerder.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Minder handelingen per bestelling in de piek",
          "Klanten die zelf hun pakket kunnen volgen, dus minder vragen aan de klantenservice",
          "Geen verkeerd geadresseerde labels meer",
        ],
      },
      ...staart(
        ["Koppeling met [vervoerder] — [bedrag]", "Extra vervoerder — [bedrag] per stuk"],
        "[X] weken.",
        ["Een account bij [vervoerder] met API-toegang", "Jullie verzendtarieven en -regels"],
      ),
    ]),
  },
  {
    key: "off_marktplaatsen",
    naam: "A4 · Verkoopkanalen samenbrengen",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "{{bedrijf}} verkoopt via de eigen webshop én via [kanalen]. Elk kanaal heeft zijn eigen beheeromgeving, en de voorraad wordt op meerdere plekken bijgehouden.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Eén centrale plek waar producten en voorraad vandaan komen.",
          "Bestellingen uit alle kanalen komen op één plek binnen.",
          "Voorraad wordt over de kanalen verdeeld en bij verkoop overal bijgewerkt.",
          "Prijzen per kanaal instelbaar, want een marktplaats vraagt om een andere marge.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Eén keer invoeren in plaats van [aantal] keer",
          "Geen dubbele verkopen meer van hetzelfde laatste stuk",
          "Ruimte om een extra kanaal te openen zonder extra werk",
        ],
      },
      ...staart(
        ["Centrale inrichting — [bedrag]", "Per kanaal aansluiten — [bedrag]"],
        "[X] weken, kanaal voor kanaal live.",
        ["Toegang tot elk verkoopkanaal", "Afspraken over welke prijs waar geldt"],
      ),
    ]),
  },
  {
    key: "off_maatwerk_api",
    naam: "A5 · Maatwerkkoppeling tussen twee systemen",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "[Systeem A] en [systeem B] praten bij {{bedrijf}} niet met elkaar. De gegevens worden nu overgezet via [export/import of handwerk].",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "In kaart brengen welke gegevens precies heen en weer moeten, en in welke richting.",
          "Een koppeling die dat op vaste momenten of direct bij een wijziging doet.",
          "Foutafhandeling met een melding aan een echte persoon — niet alleen een logregel.",
          "Een testomgeving waarin jullie het kunnen uitproberen voordat het live gaat.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Geen exportbestanden meer die iemand moet onthouden",
          "Gegevens die overal hetzelfde zijn",
          "Een koppeling die van ons is, niet van één medewerker",
        ],
      },
      ...staart(
        ["Analyse en ontwerp — [bedrag]", "Bouw en test — [bedrag]"],
        "[X] weken, waarvan de eerste week analyse.",
        ["Documentatie of toegang tot beide systemen", "Iemand die het proces van binnenuit kent"],
      ),
    ]),
  },

  // ==========================================================================
  // B · Webshop & e-commerce
  // ==========================================================================
  {
    key: "off_shop_snelheid",
    naam: "B1 · Webshop sneller maken",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "{{website}} laadt op mobiel in [X] seconden. Dat kost bezoekers vóórdat ze iets gezien hebben — en het is niet zichtbaar in jullie cijfers, want die mensen komen nooit op een productpagina.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Meten waar de tijd blijft: afbeeldingen, scripts van derden, serverantwoord.",
          "Afbeeldingen omzetten naar moderne formaten en op maat uitleveren.",
          "Scripts van derden opschonen en uitgesteld laden.",
          "Caching inrichten voor de pagina's die het meest bezocht worden.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Laadtijd naar [doel] seconden op mobiel",
          "Een meetbaar hogere conversie — vuistregel: elke seconde winst telt",
          "Betere vindbaarheid, want snelheid weegt mee",
        ],
      },
      ...staart(
        ["Analyse en meting — [bedrag]", "Uitvoering — [bedrag]", "Nameting na twee weken — inbegrepen"],
        "[X] weken.",
        ["Toegang tot de hosting en de shop", "Toestemming om scripts van derden te verwijderen"],
      ),
    ]),
  },
  {
    key: "off_checkout",
    naam: "B2 · Afrekenproces verbeteren",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Van de bezoekers die bij {{bedrijf}} iets in hun winkelwagen leggen, rondt [percentage] het niet af. Op mobiel ligt dat nog hoger.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Het hele afrekenproces stap voor stap doorlopen op telefoon en desktop, en vastleggen waar mensen afhaken.",
          "Het aantal stappen en verplichte velden terugbrengen tot wat echt nodig is.",
          "Bezorgkosten en levertijd eerder tonen — de meestgenoemde reden om af te haken.",
          "Betaalmethoden aanvullen met wat jullie doelgroep verwacht.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Meer afgeronde bestellingen uit hetzelfde bezoek",
          "Minder vragen aan de klantenservice over verzendkosten",
          "Inzicht in wáár het misgaat, ook na deze opdracht",
        ],
      },
      ...staart(
        ["Analyse van het afrekenproces — [bedrag]", "Aanpassingen — [bedrag]"],
        "[X] weken.",
        ["Toegang tot de shop en de statistieken", "Inzicht in de huidige betaalmethoden"],
      ),
    ]),
  },
  {
    key: "off_productdata",
    naam: "B3 · Productgegevens op orde",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "De productgegevens van {{bedrijf}} staan verspreid: deels in de shop, deels in spreadsheets, deels bij de leverancier. Een productwijziging kost daardoor op meerdere plekken werk.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Eén plek waar productgegevens vandaan komen, met vaste velden en eenheden.",
          "Leveranciersbestanden automatisch inlezen en omzetten naar jullie indeling.",
          "Van daaruit vullen: webshop, verkoopkanalen en documenten.",
          "Een controle die meldt welke producten nog gegevens missen.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Eén keer wijzigen in plaats van overal",
          "Volledige productpagina's, wat helpt bij vindbaarheid en conversie",
          "Een nieuw kanaal openen zonder de hele catalogus opnieuw in te voeren",
        ],
      },
      ...staart(
        ["Inrichting centrale productgegevens — [bedrag]", "Per leveranciersbestand — [bedrag]"],
        "[X] weken.",
        ["Voorbeeldbestanden van jullie leveranciers", "Een besluit over welke velden verplicht zijn"],
      ),
    ]),
  },
  {
    key: "off_zoekfunctie",
    naam: "B4 · Zoekfunctie en filters",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Bezoekers die op {{website}} zoeken, vinden niet altijd wat ze zoeken — terwijl juist die bezoekers het vaakst kopen.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een zoekfunctie die typefouten en synoniemen aankan.",
          "Filters die passen bij hoe jullie klanten denken, niet bij hoe de database is ingedeeld.",
          "Zoekresultaten met afbeelding, prijs en voorraad in beeld.",
          "Een overzicht van zoekopdrachten zonder resultaat — dat is je gratis assortimentsonderzoek.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Hogere conversie bij bezoekers die zoeken",
          "Zicht op wat klanten zoeken en jullie niet voeren",
          "Minder afhakers op categoriepagina's",
        ],
      },
      ...staart(
        ["Inrichting zoekfunctie — [bedrag]", "Filters per categorie — [bedrag]"],
        "[X] weken.",
        ["Toegang tot de shop", "Overleg over de filters per productgroep"],
      ),
    ]),
  },
  {
    key: "off_b2b_portaal",
    naam: "B5 · Zakelijke bestelomgeving",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Zakelijke klanten van {{bedrijf}} bestellen nu per e-mail of telefoon. Elke bestelling wordt bij jullie met de hand ingevoerd, inclusief de afgesproken staffelprijzen.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een afgeschermde omgeving waar zakelijke klanten inloggen en hun eigen prijzen zien.",
          "Bestellen op artikelnummer en herhaalbestellingen met één klik.",
          "Bestelgeschiedenis, pakbonnen en facturen zelf te downloaden.",
          "Bestellingen komen binnen in hetzelfde systeem als de rest.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Minder invoerwerk bij jullie, meer gemak bij hen",
          "Geen prijsdiscussies meer — iedereen ziet zijn eigen afspraak",
          "Klanten die 's avonds bestellen in plaats van te wachten op kantooruren",
        ],
      },
      ...staart(
        ["Bouw bestelomgeving — [bedrag]", "Inladen klantafspraken — [bedrag]"],
        "[X] weken, met een pilot bij [aantal] klanten.",
        ["Overzicht van klantgroepen en prijsafspraken", "Een klant die wil meedenken in de pilot"],
      ),
    ]),
  },

  // ==========================================================================
  // C · Backoffice-automatisering
  // ==========================================================================
  {
    key: "off_orderverwerking",
    naam: "C1 · Orderverwerking automatiseren",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Een bestelling gaat bij {{bedrijf}} door [aantal] handelingen voordat hij de deur uit is. Het meeste daarvan is overtypen en aanvinken.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Het proces uittekenen van binnenkomst tot verzending, met de tijd per stap.",
          "De stappen die geen menselijk oordeel vragen automatiseren.",
          "De stappen die dát wél doen, voorzien van de informatie om snel te beslissen.",
          "Een dagstart-overzicht: wat ligt er, wat is blijven hangen, wat is spoed.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "[X] uur per week terug bij de orderverwerking",
          "Piekdagen zonder overwerk",
          "Nieuwe medewerkers sneller ingewerkt",
        ],
      },
      ...staart(
        ["Procesanalyse — [bedrag]", "Bouw en inrichting — [bedrag]"],
        "[X] weken, met een meeloopweek aan het eind.",
        ["Een dagdeel met de mensen die het werk nu doen", "Toegang tot de betrokken systemen"],
      ),
    ]),
  },
  {
    key: "off_facturatie",
    naam: "C2 · Facturatie en aanmaningen",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Facturen worden bij {{bedrijf}} met de hand opgemaakt en verstuurd, en het bewaken van openstaande posten gebeurt als iemand eraan denkt.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Facturen automatisch opmaken vanuit de geleverde order of het urenoverzicht.",
          "Versturen per e-mail, met een betaallink erin.",
          "Een aanmaningsreeks die vanzelf loopt: vriendelijk, dan zakelijk, dan een telefoonsignaal voor jullie.",
          "Een overzicht van openstaande posten op ouderdom.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Sneller betaald worden — vaak het grootste effect van deze opdracht",
          "Geen vergeten facturen meer",
          "Minder ongemakkelijke belletjes, want de reeks doet het voorwerk",
        ],
      },
      ...staart(
        ["Inrichting facturatie — [bedrag]", "Aanmaningsreeks — [bedrag]"],
        "[X] weken.",
        ["Jullie betalingsvoorwaarden", "Toegang tot het boekhoudpakket"],
      ),
    ]),
  },
  {
    key: "off_inkoop",
    naam: "C3 · Inkoop en leveranciers",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Inkooporders worden bij {{bedrijf}} handmatig opgesteld, en of een levering compleet binnenkwam blijkt vaak pas later.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Bestelvoorstellen op basis van voorraad, verkoopsnelheid en levertijd.",
          "Inkooporders met één handeling versturen naar de leverancier.",
          "Ontvangst afvinken op de telefoon, met directe verwerking in de voorraad.",
          "Een signaal bij verschillen tussen besteld, geleverd en gefactureerd.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Minder nee-verkopen en minder dood kapitaal in het magazijn",
          "Verschillen die aan het licht komen zolang je er nog iets aan kunt doen",
          "Inkoop die niet meer op één persoon leunt",
        ],
      },
      ...staart(
        ["Bestelvoorstellen — [bedrag]", "Ontvangst en controle — [bedrag]"],
        "[X] weken.",
        ["Levertijden per leverancier", "Toegang tot het voorraadsysteem"],
      ),
    ]),
  },
  {
    key: "off_rapportage",
    naam: "C4 · Managementrapportage",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "De cijfers van {{bedrijf}} staan verspreid over meerdere systemen. Een overzicht maken kost iemand elke maand [X] uur handwerk in Excel.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Vaststellen welke cijfers er werkelijk toe doen — liever acht goede dan veertig.",
          "Die cijfers automatisch ophalen uit de bronsystemen.",
          "Eén overzicht dat elke ochtend klaarstaat, op telefoon en scherm.",
          "Een maandrapport dat zichzelf opmaakt en verstuurt.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "[X] uur per maand terug",
          "Cijfers waar niemand meer over hoeft te discussiëren",
          "Eerder zien dat iets scheefloopt",
        ],
      },
      ...staart(
        ["Inrichting rapportage — [bedrag]", "Per extra bron — [bedrag]"],
        "[X] weken.",
        ["Een sessie om de cijfers vast te stellen", "Toegang tot de bronsystemen"],
      ),
    ]),
  },
  {
    key: "off_documenten",
    naam: "C5 · Documenten en archief",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Offertes, opdrachtbevestigingen en pakbonnen worden bij {{bedrijf}} met de hand opgemaakt en op wisselende plekken bewaard.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Sjablonen in jullie huisstijl die zich vullen met de juiste gegevens.",
          "Documenten die vanzelf op de juiste plek in Drive belanden, met een vaste naamgeving.",
          "Digitaal ondertekenen waar dat mag.",
          "Terugvinden op klant, datum of bedrag.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Documenten die er altijd hetzelfde uitzien",
          "Terugvinden in seconden in plaats van minuten",
          "Geen versies meer die alleen op iemands bureaublad staan",
        ],
      },
      ...staart(
        ["Sjablonen en opslag — [bedrag]", "Digitaal ondertekenen — [bedrag]"],
        "[X] weken.",
        ["Jullie huisstijlbestanden", "Afspraken over de mappenstructuur"],
      ),
    ]),
  },

  // ==========================================================================
  // D · Websites & portalen
  // ==========================================================================
  {
    key: "off_website",
    naam: "D1 · Nieuwe zakelijke website",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "De website van {{bedrijf}} vertelt niet wat jullie werkelijk doen, en levert nauwelijks aanvragen op.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Vaststellen wie er moet landen en welke vraag die persoon heeft.",
          "Een opbouw die naar één duidelijke actie leidt, per pagina.",
          "Ontwerp in jullie huisstijl, gebouwd voor telefoon eerst.",
          "Zelf teksten en afbeeldingen kunnen wijzigen, zonder ons.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Aanvragen van mensen die al weten waarvoor ze komen",
          "Een site die je zelf bijhoudt",
          "Een fundament waar later pagina's bij kunnen",
        ],
      },
      ...staart(
        ["Ontwerp — [bedrag]", "Bouw — [bedrag]", "Teksten — [bedrag]"],
        "[X] weken, met twee momenten waarop jullie meekijken.",
        ["Beeldmateriaal en logo", "Eén beslisser voor de terugkoppeling"],
      ),
    ]),
  },
  {
    key: "off_klantportaal",
    naam: "D2 · Klantportaal",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Klanten van {{bedrijf}} bellen of mailen voor informatie die ze ook zelf zouden kunnen opzoeken: de stand van hun opdracht, hun facturen, hun documenten.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een afgeschermde omgeving waar elke klant zijn eigen dossier ziet.",
          "Stand van zaken, documenten en facturen op één plek.",
          "Berichten heen en weer, zodat het niet in mailboxen verdwijnt.",
          "Een melding bij jullie zodra een klant iets aanlevert.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Minder vragen die niemand hoeft te beantwoorden",
          "Klanten die het gevoel hebben dat ze zicht hebben op hun opdracht",
          "Alles op één plek terug te vinden, ook maanden later",
        ],
      },
      ...staart(
        ["Bouw portaal — [bedrag]", "Koppeling met [systeem] — [bedrag]"],
        "[X] weken, met een pilot bij een paar klanten.",
        ["Besluit over wat een klant wel en niet mag zien", "Toegang tot de bronsystemen"],
      ),
    ]),
  },
  {
    key: "off_landingspagina",
    naam: "D3 · Landingspagina voor een campagne",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "{{bedrijf}} wil met [campagne] naar buiten. Bezoekers landen nu op de algemene website, waar ze zelf moeten uitzoeken wat de aanbieding was.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Eén pagina met één boodschap en één actie.",
          "Tekst die aansluit op de advertentie waar ze vandaan komen.",
          "Een formulier dat alleen vraagt wat je echt nodig hebt.",
          "Meting per bron, zodat je weet welk kanaal werkt.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Meer aanvragen uit hetzelfde advertentiebudget",
          "Weten welk kanaal rendeert",
          "Een opzet die je voor de volgende campagne hergebruikt",
        ],
      },
      ...staart(
        ["Pagina en tekst — [bedrag]", "Meting inrichten — [bedrag]"],
        "[X] weken.",
        ["De campagneboodschap", "Toegang tot het advertentieaccount"],
      ),
    ]),
  },
  {
    key: "off_intranet",
    naam: "D4 · Interne werkomgeving",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Interne informatie zit bij {{bedrijf}} in mailboxen, mappen en hoofden. Nieuwe medewerkers moeten het vragen, en dat kost twee mensen tijd.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Eén plek voor werkafspraken, handleidingen en formulieren.",
          "Zoeken dat werkt, ook als je niet weet hoe het document heet.",
          "Aanvragen (verlof, materiaal, declaraties) via een formulier in plaats van een mailtje.",
          "Beheer bij jullie zelf, zonder dat er iemand voor nodig is die kan programmeren.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Nieuwe mensen sneller zelfstandig",
          "Minder onderbrekingen bij de mensen die alles weten",
          "Afspraken die vindbaar zijn in plaats van mondeling",
        ],
      },
      ...staart(
        ["Inrichting — [bedrag]", "Overzetten bestaande documenten — [bedrag]"],
        "[X] weken.",
        ["Een inventarisatie van wat er nu rondzwerft", "Een eigenaar per onderwerp"],
      ),
    ]),
  },
  {
    key: "off_configurator",
    naam: "D5 · Productconfigurator",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Producten van {{bedrijf}} worden op maat samengesteld. Elke aanvraag gaat nu heen en weer per e-mail voordat er een prijs op tafel ligt.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een configurator waarin de klant zijn keuzes maakt, met alleen de geldige combinaties.",
          "Directe prijsberekening volgens jullie regels.",
          "Een offerte die er meteen uitrolt, in jullie huisstijl.",
          "De aanvraag komt binnen inclusief alle keuzes — geen navragen meer.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Van aanvraag naar offerte in minuten in plaats van dagen",
          "Geen onmogelijke combinaties meer die pas in de productie opvallen",
          "Aanvragen buiten kantooruren",
        ],
      },
      ...staart(
        ["Configuratielogica — [bedrag]", "Ontwerp en bouw — [bedrag]"],
        "[X] weken, waarvan de eerste aan de regels.",
        ["De volledige optielijst met prijsregels", "Iemand die de uitzonderingen kent"],
      ),
    ]),
  },

  // ==========================================================================
  // E · Onderhoud & doorlopende diensten
  // ==========================================================================
  {
    key: "off_onderhoud",
    naam: "E1 · Onderhoudsabonnement",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Wat we voor {{bedrijf}} gebouwd hebben moet blijven werken, ook als een leverancier iets wijzigt of er een beveiligingslek opduikt.",
      },
      {
        kop: "Wat we voorstellen",
        punten: [
          "Bewaking van de koppelingen, met een melding bij ons vóórdat jullie het merken",
          "Beveiligings- en versie-updates",
          "Een vast aantal uren per maand voor kleine wijzigingen",
          "Reactietijd van [X] uur bij een storing",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Geen verrassingen bij een update van een leverancier",
          "Een vast aanspreekpunt in plaats van zoeken wie er verstand van heeft",
          "Voorspelbare kosten",
        ],
      },
      ...staart(
        ["Abonnement — [bedrag] per maand", "Meerwerk buiten de uren — [uurtarief]"],
        "Loopt per maand, opzegtermijn één maand.",
        ["Een contactpersoon voor storingen", "Toegang tot de omgevingen"],
      ),
    ]),
  },
  {
    key: "off_doorontwikkeling",
    naam: "E2 · Doorontwikkeling per maand",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "{{bedrijf}} heeft geen enkel groot project nodig, maar wel een vaste stroom kleine verbeteringen zonder daar telkens een offerte voor te vragen.",
      },
      {
        kop: "Wat we voorstellen",
        punten: [
          "Een vast aantal uren per maand, in te zetten waar het op dat moment nodig is",
          "Elke maand samen bepalen wat voorrang krijgt",
          "Ongebruikte uren schuiven één maand door",
          "Elke maand een overzicht van wat er gedaan is",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Verbeteren zonder telkens een offertetraject",
          "Voorspelbare kosten",
          "Een partij die jullie systemen kent, dus geen inwerktijd",
        ],
      },
      ...staart(
        ["[Aantal] uur per maand — [bedrag]", "Extra uren — [uurtarief]"],
        "Per kwartaal, daarna maandelijks opzegbaar.",
        ["Een vast overlegmoment", "Iemand die intern prioriteiten stelt"],
      ),
    ]),
  },
  {
    key: "off_hosting",
    naam: "E3 · Hosting en beheer",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "De hosting van {{bedrijf}} is verspreid over meerdere partijen, en het is niet altijd duidelijk wie waarvoor verantwoordelijk is als er iets misgaat.",
      },
      {
        kop: "Wat we voorstellen",
        punten: [
          "Alles onderbrengen op één omgeving, met certificaten en domeinen erbij",
          "Dagelijkse back-ups, met een terugzetproef die we ook echt uitvoeren",
          "Bewaking van beschikbaarheid, dag en nacht",
          "Eén partij die aanspreekbaar is",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Geen verlopen certificaten of domeinen meer",
          "Back-ups waarvan bewezen is dat ze werken",
          "Eén nummer om te bellen",
        ],
      },
      ...staart(
        ["Overzetten — eenmalig [bedrag]", "Hosting en beheer — [bedrag] per maand"],
        "Overzetten in [X] weken, buiten kantooruren.",
        ["Toegang tot de huidige partijen", "Een gepland moment voor de overgang"],
      ),
    ]),
  },
  {
    key: "off_support",
    naam: "E4 · Ondersteuning voor medewerkers",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Vragen van medewerkers van {{bedrijf}} over de systemen komen nu bij één collega terecht die er eigenlijk geen tijd voor heeft.",
      },
      {
        kop: "Wat we voorstellen",
        punten: [
          "Een vast punt waar vragen binnenkomen, per mail of telefoon",
          "Reactie binnen [X] uur op werkdagen",
          "Terugkerende vragen omzetten in korte handleidingen",
          "Een maandoverzicht van wat er speelt — dat wijst de volgende verbetering aan",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Die ene collega kan weer aan zijn eigen werk",
          "Medewerkers die geholpen worden in plaats van te wachten",
          "Zicht op waar het systeem nog schuurt",
        ],
      },
      ...staart(
        ["Ondersteuning — [bedrag] per maand", "Buiten kantooruren — [bedrag]"],
        "Per maand, opzegtermijn één maand.",
        ["Een lijst met wie waarvoor mag bellen", "Toegang tot de systemen"],
      ),
    ]),
  },
  {
    key: "off_scan",
    naam: "E5 · Jaarlijkse doorlichting",
    inhoud_html: doc(INTRO, [
      {
        kop: "Wat we begrepen hebben",
        tekst:
          "Wat we voor {{bedrijf}} gebouwd hebben draait, maar het bedrijf verandert. Wat vorig jaar de beste oplossing was, hoeft dat nu niet meer te zijn.",
      },
      {
        kop: "Wat we voorstellen",
        genummerd: [
          "Een keer per jaar de hele inrichting doorlopen: koppelingen, processen, techniek.",
          "Meten wat het inmiddels oplevert en waar nieuwe knelpunten zitten.",
          "Een verslag met bevindingen, op volgorde van wat het meeste scheelt.",
          "Een voorstel voor het komende jaar, met bedragen.",
        ],
      },
      {
        kop: "Wat het oplevert",
        punten: [
          "Weten of de investering nog rendeert",
          "Knelpunten opsporen voordat ze pijn doen",
          "Een onderbouwd plan in plaats van onderbuikgevoel",
        ],
      },
      ...staart(
        ["Doorlichting en verslag — [bedrag]"],
        "[X] weken, jaarlijks op een vast moment.",
        ["Een dagdeel met de betrokken medewerkers", "Toegang tot de cijfers"],
      ),
    ]),
  },
];
