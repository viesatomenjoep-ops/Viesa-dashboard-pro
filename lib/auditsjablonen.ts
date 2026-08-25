/**
 * 25 auditsjablonen.
 *
 * Vijf blokken, elk vijf audits:
 *
 *   A. Webshop & conversie (1–5)
 *   B. Processen & backoffice (6–10)
 *   C. Techniek & data (11–15)
 *   D. Vindbaarheid & marketing (16–20)
 *   E. Risico & naleving (21–25)
 *
 * Elk verslag volgt dezelfde opbouw:
 *
 *   1. Samenvatting        — de kern in vijf regels, want dit is wat gelezen wordt
 *   2. Wat we onderzocht   — de reikwijdte, zodat niemand iets anders verwacht
 *   3. Bevindingen         — op volgorde van impact, niet van vindmoment
 *   4. Aanbevelingen       — genummerd, want dit is een volgorde
 *   5. Verwachte impact    — in uren en euro's waar het kan
 *   6. Vervolgstappen      — anders belandt het verslag in een la
 *
 * Een audit is pas iets waard als er een getal in staat. Overal waar [X] staat
 * hoort een gemeten of geschat cijfer — laat dat nooit leeg.
 */

export type AuditSjabloon = {
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

function doc(secties: Sectie[]): string {
  const delen: string[] = [];
  for (const s of secties) {
    delen.push(`<h2>${s.kop}</h2>`);
    if (s.tekst) delen.push(`<p>${s.tekst}</p>`);
    if (s.punten) delen.push(`<ul>${s.punten.map((p) => `<li>${p}</li>`).join("")}</ul>`);
    if (s.genummerd)
      delen.push(`<ol>${s.genummerd.map((p) => `<li>${p}</li>`).join("")}</ol>`);
  }
  return delen.join("");
}

/** De vaste staart van elk auditverslag. */
function staart(impact: string[], vervolg: string[]): Sectie[] {
  return [
    { kop: "Verwachte impact", punten: impact },
    { kop: "Vervolgstappen", genummerd: vervolg },
  ];
}

export const AUDIT_SJABLONEN: AuditSjabloon[] = [
  // ==========================================================================
  // A · Webshop & conversie
  // ==========================================================================
  {
    key: "aud_webshop",
    naam: "A1 · Webshop-audit (volledig)",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "We hebben de webshop van {{bedrijf}} doorgelicht op snelheid, mobiel gebruik, het afrekenproces en de productpagina's. De grootste winst zit in [onderwerp]: dat kost naar schatting [X] omzet per jaar en is binnen [periode] op te lossen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Laadtijd op mobiel en desktop, gemeten op [aantal] pagina's",
          "Het volledige afrekenproces, van winkelwagen tot bedankpagina",
          "Productpagina's: informatie, beeld, voorraad en verzendinformatie",
          "Zoekfunctie en filters",
        ],
      },
      {
        kop: "Bevindingen",
        tekst: "Op volgorde van wat het meeste kost.",
        punten: [
          "<strong>[Bevinding 1]</strong> — [wat we zagen, met cijfer]. Gevolg: [gevolg].",
          "<strong>[Bevinding 2]</strong> — [wat we zagen]. Gevolg: [gevolg].",
          "<strong>[Bevinding 3]</strong> — [wat we zagen]. Gevolg: [gevolg].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Belangrijkste ingreep] — grootste effect, [inspanning]",
          "[Tweede ingreep] — [inspanning]",
          "[Derde ingreep] — [inspanning]",
        ],
      },
      ...staart(
        [
          "Laadtijd van [huidig] naar [doel] seconden",
          "Geschat [X]% meer afgeronde bestellingen",
          "Op jaarbasis ongeveer [bedrag]",
        ],
        [
          "Bespreken van dit verslag — een half uur",
          "Voorstel voor de eerste ingreep",
          "Nameting [X] weken na oplevering",
        ],
      ),
    ]),
  },
  {
    key: "aud_checkout",
    naam: "A2 · Afrekenproces",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Van de bezoekers die bij {{bedrijf}} een product in de winkelwagen leggen, rondt [X]% niet af. Op mobiel is dat [Y]%. De belangrijkste oorzaak is [oorzaak].",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Het afrekenproces stap voor stap, op telefoon en desktop",
          "Aantal stappen, velden en verplichte gegevens",
          "Waar bezorgkosten en levertijd zichtbaar worden",
          "Beschikbare betaalmethoden",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Afhaakmoment</strong> — de meeste bezoekers stoppen bij [stap].",
          "<strong>Verzendkosten</strong> — worden pas zichtbaar bij [stap]; dat is de meestgenoemde reden om af te haken.",
          "<strong>Formulier</strong> — [aantal] verplichte velden, waarvan [aantal] niet nodig voor de levering.",
          "<strong>Betaalmethoden</strong> — [wat ontbreekt] wordt door jullie doelgroep verwacht.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Verzendkosten tonen vanaf de winkelwagen",
          "Verplichte velden terugbrengen naar [aantal]",
          "[Betaalmethode] toevoegen",
          "Afrekenen zonder account mogelijk maken",
        ],
      },
      ...staart(
        ["Afhaakpercentage van [X]% naar [doel]%", "Ongeveer [bedrag] extra omzet per jaar"],
        ["Bespreken", "Aanpassingen doorvoeren", "Vier weken meten en vergelijken"],
      ),
    ]),
  },
  {
    key: "aud_mobiel",
    naam: "A3 · Mobiel gebruik",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "[X]% van het bezoek aan {{website}} komt van een telefoon, maar de conversie ligt daar [Y]% lager dan op desktop. Dat verschil is grotendeels op te lossen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "De site op [aantal] telefoonformaten, iOS en Android",
          "Leesbaarheid, knopgroottes en aanraakgebieden",
          "Menu en navigatie op klein scherm",
          "Formulieren en toetsenbordgedrag",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>[Bevinding]</strong> — [beschrijving], op [welke toestellen].",
          "<strong>Knoppen</strong> — [aantal] belangrijke knoppen zijn kleiner dan de aanbevolen 44 pixels.",
          "<strong>Tekst</strong> — [waar] is kleiner dan 16 pixels, wat op iOS ongewenst inzoomen veroorzaakt.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Belangrijkste mobiele ingreep]",
          "Knoppen en aanraakgebieden vergroten",
          "Formulieren het juiste toetsenbord laten openen",
        ],
      },
      ...staart(
        ["Mobiele conversie dichter bij die van desktop", "Ongeveer [bedrag] per jaar"],
        ["Bespreken", "Aanpassen", "Nameten op mobiel"],
      ),
    ]),
  },
  {
    key: "aud_productpaginas",
    naam: "A4 · Productpagina's",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De productpagina's van {{bedrijf}} missen informatie waar kopers op beslissen. Bij [X] van de [Y] bekeken producten ontbrak [wat].",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "[Aantal] productpagina's uit [aantal] categorieën",
          "Beschikbare informatie: maten, materiaal, levertijd, voorraad",
          "Beeldmateriaal: aantal, kwaliteit, uitsnede",
          "Beoordelingen en aanvullende producten",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Ontbrekende gegevens</strong> — [X]% van de producten mist [veld].",
          "<strong>Beeld</strong> — gemiddeld [aantal] foto's per product; [X] producten hebben er maar één.",
          "<strong>Levertijd</strong> — [wel/niet] zichtbaar vóór het afrekenen.",
          "<strong>Teksten</strong> — [bevinding over overgenomen leveranciersteksten].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Verplichte velden vaststellen en aanvullen",
          "Minimaal [aantal] foto's per product",
          "Levertijd en voorraad op de productpagina tonen",
          "Eigen teksten voor de [aantal] bestverkopende producten",
        ],
      },
      ...staart(
        ["Hogere conversie op productpagina's", "Minder retouren door duidelijkere verwachtingen"],
        ["Bespreken", "Velden vaststellen", "Aanvullen, bestsellers eerst"],
      ),
    ]),
  },
  {
    key: "aud_zoek",
    naam: "A5 · Zoeken en navigatie",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Bezoekers die zoeken kopen doorgaans het vaakst. Bij {{bedrijf}} levert [X]% van de zoekopdrachten geen enkel resultaat op.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "De [aantal] meestgebruikte zoekopdrachten",
          "Omgang met typefouten, meervoud en synoniemen",
          "Filters per categorie",
          "Menustructuur en kruimelpad",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Zonder resultaat</strong> — [X]% van de zoekopdrachten; vaakst [voorbeeld].",
          "<strong>Typefouten</strong> — worden [wel/niet] opgevangen.",
          "<strong>Filters</strong> — [bevinding], bijvoorbeeld [voorbeeld].",
          "<strong>Categorieën</strong> — [aantal] niveaus diep; bezoekers verdwalen bij [waar].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Zoekfunctie met typefout- en synoniemherkenning",
          "Synoniemenlijst voor de termen die klanten gebruiken",
          "Filters per categorie herzien",
          "Zoekopdrachten zonder resultaat maandelijks bekijken",
        ],
      },
      ...staart(
        ["Hogere conversie bij zoekende bezoekers", "Zicht op gemiste vraag in het assortiment"],
        ["Bespreken", "Zoekfunctie inrichten", "Maandelijks de lege zoekopdrachten doornemen"],
      ),
    ]),
  },

  // ==========================================================================
  // B · Processen & backoffice
  // ==========================================================================
  {
    key: "aud_proces",
    naam: "B1 · Procesaudit backoffice",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "We hebben de administratieve processen van {{bedrijf}} gevolgd van binnenkomende order tot betaalde factuur. Er gaat naar schatting [X] uur per week op aan werk dat een systeem kan doen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Het orderproces van binnenkomst tot verzending",
          "Facturatie en debiteurenbewaking",
          "Inkoop en voorraadbeheer",
          "Gesprekken met [aantal] medewerkers die het werk dagelijks doen",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Overtypen</strong> — dezelfde gegevens worden [aantal] keer ingevoerd, in [systemen].",
          "<strong>Handmatige controles</strong> — [X] uur per week aan controlewerk dat geregeld kan worden.",
          "<strong>Eén persoon</strong> — [proces] leunt volledig op één medewerker.",
          "<strong>Fouten</strong> — [aantal] correcties per [periode], vooral bij [waar].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Grootste tijdvreter] automatiseren — [X] uur per week",
          "[Tweede proces] — [X] uur per week",
          "[Proces] vastleggen zodat het niet van één persoon afhangt",
        ],
      },
      ...staart(
        [
          "[X] uur per week terug, ongeveer [bedrag] per jaar",
          "Minder correcties achteraf",
          "Minder afhankelijk van één medewerker",
        ],
        ["Bespreken met het team", "Voorstel voor de eerste twee processen", "Na drie maanden opnieuw meten"],
      ),
    ]),
  },
  {
    key: "aud_orderdoorloop",
    naam: "B2 · Doorlooptijd van orders",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Een order doet er bij {{bedrijf}} gemiddeld [X] uur over van binnenkomst tot verzending. Daarvan is [Y] uur wachttijd.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "[Aantal] orders gevolgd van binnenkomst tot verzending",
          "Tijd per stap, en tijd tussen de stappen",
          "Wat er gebeurt bij een piek of bij ziekte",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Wachttijd</strong> — [Y] van de [X] uur is wachten, vooral bij [stap].",
          "<strong>Knelpunt</strong> — [stap] kan maar door [aantal] mensen worden gedaan.",
          "<strong>Piek</strong> — bij meer dan [aantal] orders per dag loopt [stap] vast.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Stap] automatisch laten doorlopen in plaats van op iemand wachten",
          "[Stap] door meer mensen laten uitvoeren",
          "Signalering op orders die langer dan [X] uur stilstaan",
        ],
      },
      ...staart(
        ["Doorlooptijd van [X] naar [doel] uur", "Piekdagen zonder overwerk"],
        ["Bespreken", "Knelpunt aanpakken", "Doorlooptijd blijven meten"],
      ),
    ]),
  },
  {
    key: "aud_debiteuren",
    naam: "B3 · Debiteuren en betaalgedrag",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Klanten van {{bedrijf}} betalen gemiddeld na [X] dagen, bij een betaaltermijn van [Y]. Er staat [bedrag] open, waarvan [bedrag] langer dan 60 dagen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Openstaande posten naar ouderdom",
          "Betaalgedrag per klantgroep",
          "Het aanmaanproces zoals het nu loopt",
          "Betaalmogelijkheden op de factuur",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Betaaltermijn</strong> — gemiddeld [X] dagen te laat.",
          "<strong>Aanmanen</strong> — gebeurt [hoe], en is daarmee afhankelijk van of iemand eraan denkt.",
          "<strong>Grootste posten</strong> — [aantal] klanten zijn samen goed voor [percentage] van het openstaande bedrag.",
          "<strong>Factuur</strong> — [wel/geen] betaallink.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Aanmaningsreeks die vanzelf loopt",
          "Betaallink op elke factuur",
          "Wekelijks een overzicht op ouderdom",
          "Afspraken maken met de [aantal] grootste openstaande klanten",
        ],
      },
      ...staart(
        ["Betaaltermijn [X] dagen korter", "Ongeveer [bedrag] eerder beschikbaar"],
        ["Bespreken", "Aanmaningsreeks inrichten", "Maandelijks volgen"],
      ),
    ]),
  },
  {
    key: "aud_voorraad",
    naam: "B4 · Voorraadbeheer",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De voorraadadministratie van {{bedrijf}} wijkt op [X]% van de artikelen af van de werkelijke voorraad. Er ligt voor [bedrag] aan artikelen die het afgelopen jaar niet verkocht zijn.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Steekproef op [aantal] artikelen: administratie tegenover werkelijkheid",
          "Omloopsnelheid per productgroep",
          "Nee-verkopen in de afgelopen [periode]",
          "Bestelmomenten en levertijden",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Afwijkingen</strong> — [X]% van de artikelen klopt niet, gemiddeld [aantal] stuks.",
          "<strong>Stilliggend</strong> — [bedrag] aan artikelen zonder verkoop in twaalf maanden.",
          "<strong>Nee-verkopen</strong> — [aantal] keer, waarvan [aantal] op hardlopers.",
          "<strong>Bestellen</strong> — gebeurt op gevoel in plaats van op verkoopsnelheid.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Vaste tellingen op de hardlopers",
          "Bestelvoorstellen op verkoopsnelheid en levertijd",
          "Actie op de stilliggende voorraad",
          "Nee-verkopen registreren en maandelijks bekijken",
        ],
      },
      ...staart(
        ["Minder nee-verkopen", "[Bedrag] minder vastgelegd in voorraad"],
        ["Bespreken", "Telrondes inrichten", "Bestelvoorstellen invoeren"],
      ),
    ]),
  },
  {
    key: "aud_klantenservice",
    naam: "B5 · Klantenservice",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De klantenservice van {{bedrijf}} behandelt [aantal] vragen per week. Ongeveer [X]% daarvan gaat over iets dat de klant zelf had kunnen opzoeken.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "[Aantal] vragen uit [periode], ingedeeld naar onderwerp",
          "Reactietijd en afhandeltijd",
          "Beschikbare informatie op de website",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Meestgestelde vraag</strong> — [vraag], [X]% van alle contacten.",
          "<strong>Vermijdbaar</strong> — [X]% gaat over levertijd of bestelstatus.",
          "<strong>Reactietijd</strong> — gemiddeld [X] uur.",
          "<strong>Kanalen</strong> — vragen komen binnen via [aantal] kanalen, zonder één overzicht.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Bestelstatus zelf op te vragen maken",
          "Levertijd duidelijker tonen vóór het afrekenen",
          "Alle kanalen in één overzicht",
          "Antwoorden op de tien meestgestelde vragen op de site",
        ],
      },
      ...staart(
        ["[X]% minder vragen", "[X] uur per week terug", "Kortere reactietijd"],
        ["Bespreken", "Bestelstatus ontsluiten", "Na drie maanden opnieuw indelen"],
      ),
    ]),
  },

  // ==========================================================================
  // C · Techniek & data
  // ==========================================================================
  {
    key: "aud_techniek",
    naam: "C1 · Technische doorlichting",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De technische inrichting van {{bedrijf}} is doorgelicht op onderhoudbaarheid, beveiliging en continuïteit. Het belangrijkste risico is [risico].",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Versies van de gebruikte software en hun ondersteuning",
          "Hosting, certificaten en domeinen",
          "Back-ups en of ze terug te zetten zijn",
          "Toegangsrechten en beheeraccounts",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Verouderd</strong> — [component] draait op [versie]; ondersteuning is geëindigd op [datum].",
          "<strong>Back-ups</strong> — [bevinding]; een terugzetproef is [wel/niet] ooit gedaan.",
          "<strong>Toegang</strong> — [aantal] accounts met volledige rechten, waarvan [aantal] van oud-medewerkers.",
          "<strong>Certificaten</strong> — [bevinding over verlooptermijnen].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Component] bijwerken — dit is het grootste risico",
          "Terugzetproef uitvoeren en jaarlijks herhalen",
          "Ongebruikte beheeraccounts intrekken",
          "Bewaking op verlopende certificaten en domeinen",
        ],
      },
      ...staart(
        ["Kleiner risico op uitval", "Aantoonbaar werkende back-ups"],
        ["Bespreken", "Bijwerken plannen buiten kantooruren", "Jaarlijks herhalen"],
      ),
    ]),
  },
  {
    key: "aud_datakwaliteit",
    naam: "C2 · Datakwaliteit",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De klant- en productgegevens van {{bedrijf}} bevatten dubbelingen en lege velden. Van de [aantal] klantrecords is [X]% vermoedelijk dubbel.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "[Aantal] klantrecords op dubbelingen en volledigheid",
          "[Aantal] producten op ontbrekende velden",
          "Schrijfwijzen en eenheden",
          "Hoe gegevens binnenkomen",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Dubbelingen</strong> — [aantal] vermoedelijk dubbele klanten.",
          "<strong>Leeg</strong> — [X]% mist [veld], waardoor [gevolg].",
          "<strong>Schrijfwijzen</strong> — [voorbeeld] komt in [aantal] varianten voor.",
          "<strong>Oorzaak</strong> — bij binnenkomst wordt niets gecontroleerd.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Bestaande dubbelingen opruimen",
          "Controle bij invoer, zodat het niet terugkomt",
          "Vaste schrijfwijzen en eenheden vastleggen",
          "Maandelijkse controle op nieuwe afwijkingen",
        ],
      },
      ...staart(
        ["Betrouwbare cijfers", "Minder misgelopen leveringen", "Bruikbare klantsegmenten"],
        ["Bespreken", "Opschonen", "Invoercontrole inbouwen"],
      ),
    ]),
  },
  {
    key: "aud_integraties",
    naam: "C3 · Koppelingen doorlichten",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "{{bedrijf}} gebruikt [aantal] koppelingen tussen systemen. [Aantal] daarvan zijn kwetsbaar, en bij [aantal] merkt niemand het als ze stilvallen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Alle koppelingen in kaart: wat gaat waarheen, hoe vaak",
          "Foutafhandeling en meldingen",
          "Wie het beheert en wie het begrijpt",
          "Wat er gebeurt als een koppeling uitvalt",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Stille fouten</strong> — bij [aantal] koppelingen komt een fout nergens terecht.",
          "<strong>Kennis</strong> — [aantal] koppelingen zijn alleen bekend bij [persoon].",
          "<strong>Handwerk</strong> — [koppeling] moet met de hand worden gestart.",
          "<strong>Geen documentatie</strong> — voor [aantal] koppelingen.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Meldingen bij fouten, naar een persoon en niet naar een logbestand",
          "Documenteren wat er waarheen gaat",
          "[Koppeling] automatisch laten lopen",
          "Bewaking op koppelingen die stilvallen",
        ],
      },
      ...staart(
        ["Fouten binnen een dag zichtbaar", "Minder afhankelijk van één persoon"],
        ["Bespreken", "Meldingen inrichten", "Documentatie aanvullen"],
      ),
    ]),
  },
  {
    key: "aud_meting",
    naam: "C4 · Meting en statistieken",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De cijfers waarop {{bedrijf}} stuurt kloppen niet volledig. Het verschil tussen de gemeten en de werkelijke omzet is [X]%.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Inrichting van de statistieken",
          "Gemeten omzet tegenover de werkelijke omzet",
          "Doelen en trechters",
          "Toestemmingsbanner en de invloed daarvan op de meting",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Verschil</strong> — [X]% tussen gemeten en werkelijke omzet.",
          "<strong>Dubbel geteld</strong> — [bevinding].",
          "<strong>Doelen</strong> — [aantal] ingericht, waarvan [aantal] verkeerd.",
          "<strong>Toestemming</strong> — [X]% weigert, en dat verkeer valt volledig weg uit de cijfers.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Meting opnieuw inrichten en controleren tegen de werkelijke omzet",
          "Dubbeltellingen wegnemen",
          "Doelen opnieuw vaststellen",
          "Maandelijkse controle op het verschil",
        ],
      },
      ...staart(
        ["Cijfers waarop je kunt sturen", "Weten welk kanaal echt rendeert"],
        ["Bespreken", "Meting herstellen", "Maandelijks controleren"],
      ),
    ]),
  },
  {
    key: "aud_hosting",
    naam: "C5 · Hosting en beschikbaarheid",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De website van {{bedrijf}} was in de afgelopen [periode] [X] keer onbereikbaar, in totaal [tijd]. De hosting is niet ingericht op jullie piekmomenten.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Beschikbaarheid over [periode]",
          "Serverantwoordtijden onder normale en piekbelasting",
          "Verdeling van diensten over leveranciers",
          "Herstelprocedure bij uitval",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Uitval</strong> — [X] keer, samen [tijd]; steeds bij [oorzaak].",
          "<strong>Piek</strong> — antwoordtijd loopt op van [X] naar [Y] ms.",
          "<strong>Versnippering</strong> — [aantal] leveranciers, geen duidelijke verantwoordelijkheid.",
          "<strong>Herstel</strong> — geen vastgelegde procedure.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Oorzaak van de uitval] wegnemen",
          "Capaciteit afstemmen op de piek",
          "Diensten onderbrengen bij één partij",
          "Herstelprocedure vastleggen en beproeven",
        ],
      },
      ...staart(
        ["[Bedrag] minder omzetverlies door uitval", "Snellere site tijdens de piek"],
        ["Bespreken", "Oorzaak aanpakken", "Beschikbaarheid blijven meten"],
      ),
    ]),
  },

  // ==========================================================================
  // D · Vindbaarheid & marketing
  // ==========================================================================
  {
    key: "aud_seo",
    naam: "D1 · Vindbaarheid in zoekmachines",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "{{website}} wordt gevonden op [aantal] zoektermen. Op de [aantal] termen die er commercieel toe doen staat de site gemiddeld op plek [X].",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Posities op de belangrijkste zoektermen",
          "Technische vindbaarheid: indexering, snelheid, structuur",
          "Inhoud tegenover die van [aantal] concurrenten",
          "Verwijzingen van andere sites",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Gemiste termen</strong> — [aantal] termen met samen [aantal] zoekopdrachten per maand waarop jullie niet voorkomen.",
          "<strong>Technisch</strong> — [bevinding], bijvoorbeeld [voorbeeld].",
          "<strong>Inhoud</strong> — concurrenten hebben [aantal] pagina's over [onderwerp], jullie [aantal].",
          "<strong>Verwijzingen</strong> — [aantal] verwijzende domeinen tegenover gemiddeld [aantal] bij concurrenten.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Technische ingreep] — voorwaarde voor de rest",
          "Pagina's maken voor de [aantal] belangrijkste gemiste termen",
          "Bestaande pagina's uitbreiden op [onderwerp]",
          "Verwijzingen opbouwen via [aanpak]",
        ],
      },
      ...staart(
        ["[Aantal] extra bezoekers per maand", "Ongeveer [bedrag] aan bespaarde advertentiekosten"],
        ["Bespreken", "Technische ingrepen eerst", "Elk kwartaal posities meten"],
      ),
    ]),
  },
  {
    key: "aud_adverteren",
    naam: "D2 · Advertentiebudget",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "{{bedrijf}} besteedt [bedrag] per maand aan advertenties. Daarvan gaat naar schatting [X]% naar vertoningen die niets opleveren.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Campagnestructuur en budgetverdeling",
          "Zoektermen waarop daadwerkelijk is vertoond",
          "Landingspagina's per campagne",
          "Meting van conversies",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Verspilling</strong> — [bedrag] per maand naar zoektermen zonder enige conversie.",
          "<strong>Landingspagina's</strong> — [aantal] campagnes wijzen naar de algemene homepage.",
          "<strong>Meting</strong> — conversies worden [wel/niet] betrouwbaar teruggemeld.",
          "<strong>Uitsluitingen</strong> — [aantal] uitsluitingstermen ingesteld; dat is te weinig.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Niet-converterende zoektermen uitsluiten",
          "Landingspagina per campagne",
          "Conversiemeting herstellen",
          "Budget verschuiven naar wat aantoonbaar rendeert",
        ],
      },
      ...staart(
        ["[Bedrag] per maand minder verspilling", "Lagere kosten per aanvraag"],
        ["Bespreken", "Uitsluitingen doorvoeren", "Na een maand opnieuw beoordelen"],
      ),
    ]),
  },
  {
    key: "aud_email",
    naam: "D3 · E-mailmarketing",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Het bestand van {{bedrijf}} telt [aantal] adressen. De openingsgraad is [X]% en er wordt [frequentie] verstuurd — er blijft omzet liggen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Omvang en kwaliteit van het bestand",
          "Openings- en klikcijfers over [periode]",
          "Automatische reeksen: welkom, verlaten winkelwagen, na aankoop",
          "Bezorgbaarheid en technische instellingen",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Reeksen</strong> — [aantal] van de gebruikelijke reeksen ontbreekt, waaronder [welke].",
          "<strong>Bezorgbaarheid</strong> — [bevinding over SPF, DKIM en DMARC].",
          "<strong>Bestand</strong> — [X]% is al [periode] niet actief geweest.",
          "<strong>Segmentatie</strong> — iedereen krijgt dezelfde mail.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Reeks voor verlaten winkelwagens — meestal de snelste winst",
          "Welkomstreeks voor nieuwe inschrijvingen",
          "Technische instellingen op orde brengen",
          "Inactieve adressen opschonen of heractiveren",
        ],
      },
      ...staart(
        ["Ongeveer [bedrag] extra omzet per jaar", "Betere bezorging in de inbox"],
        ["Bespreken", "Reeks voor verlaten winkelwagens", "Maandelijks volgen"],
      ),
    ]),
  },
  {
    key: "aud_content",
    naam: "D4 · Inhoud en teksten",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De teksten op {{website}} beschrijven wat {{bedrijf}} doet, maar niet welk probleem het voor de lezer oplost. Dat is de belangrijkste reden dat bezoekers niet doorklikken.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "De [aantal] belangrijkste pagina's",
          "Opbouw, koppen en aanzet tot actie",
          "Leesbaarheid en jargon",
          "Vergelijking met [aantal] concurrenten",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Perspectief</strong> — [X] van de [Y] pagina's begint over jullie in plaats van over de lezer.",
          "<strong>Actie</strong> — [aantal] pagina's hebben geen duidelijke vervolgstap.",
          "<strong>Jargon</strong> — [voorbeelden] worden niet uitgelegd.",
          "<strong>Bewijs</strong> — geen cijfers, cases of klantverhalen.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Openingsalinea's herschrijven vanuit de lezer",
          "Eén duidelijke vervolgstap per pagina",
          "[Aantal] klantverhalen met concrete cijfers",
          "Jargon vervangen of uitleggen",
        ],
      },
      ...staart(
        ["Meer aanvragen uit hetzelfde bezoek", "Betere aansluiting bij de doelgroep"],
        ["Bespreken", "Belangrijkste pagina's herschrijven", "Meten wat het doet"],
      ),
    ]),
  },
  {
    key: "aud_concurrentie",
    naam: "D5 · Vergelijking met concurrenten",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "We hebben {{bedrijf}} naast [aantal] concurrenten gelegd. Jullie staan sterk op [sterkte]; op [zwakte] loopt de markt voor.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "[Aantal] concurrenten in [branche]",
          "Assortiment, prijsstelling en levervoorwaarden",
          "Snelheid, mobiel gebruik en afrekenproces",
          "Vindbaarheid en advertentie-inzet",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Sterk</strong> — op [punt] presteren jullie beter dan alle vergeleken partijen.",
          "<strong>Achterstand</strong> — op [punt] scoort de middenmoot beter.",
          "<strong>Voorwaarden</strong> — [aantal] concurrenten bieden [voorwaarde] die jullie niet bieden.",
          "<strong>Onderscheid</strong> — [bevinding over hoe jullie je positioneren].",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Achterstand] wegwerken — dit kost nu klanten",
          "[Sterkte] veel nadrukkelijker uitdragen",
          "[Voorwaarde] overwegen",
        ],
      },
      ...staart(
        ["Betere positie op [punt]", "Duidelijker onderscheid in de markt"],
        ["Bespreken", "Achterstand aanpakken", "Jaarlijks opnieuw vergelijken"],
      ),
    ]),
  },

  // ==========================================================================
  // E · Risico & naleving
  // ==========================================================================
  {
    key: "aud_avg",
    naam: "E1 · AVG en privacy",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De verwerking van persoonsgegevens bij {{bedrijf}} is doorgelicht. Er zijn [aantal] punten die aandacht vragen, waarvan [aantal] met een reëel boeterisico.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Welke persoonsgegevens worden vastgelegd en waarom",
          "Bewaartermijnen en opschoning",
          "Verwerkersovereenkomsten met leveranciers",
          "Toestemmingsbanner en verwerking van verzoeken",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Bewaartermijnen</strong> — [bevinding]; gegevens uit [jaar] staan er nog.",
          "<strong>Verwerkersovereenkomsten</strong> — ontbreken bij [aantal] leveranciers.",
          "<strong>Toestemming</strong> — de banner [voldoet wel/niet]; [toelichting].",
          "<strong>Verzoeken</strong> — geen vastgelegde werkwijze voor inzage of verwijdering.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "Verwerkersovereenkomsten afsluiten met [leveranciers]",
          "Bewaartermijnen vastleggen en automatisch opschonen",
          "Toestemmingsbanner aanpassen",
          "Werkwijze vastleggen voor verzoeken van betrokkenen",
        ],
      },
      ...staart(
        ["Kleiner boeterisico", "Aantoonbaar in orde bij een controle"],
        ["Bespreken", "Overeenkomsten regelen", "Jaarlijks opnieuw doorlopen"],
      ),
    ]),
  },
  {
    key: "aud_beveiliging",
    naam: "E2 · Informatiebeveiliging",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "De beveiliging van de systemen van {{bedrijf}} is beoordeeld. Het grootste risico is [risico]; dat is binnen [periode] op te lossen.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Toegangsrechten en beheeraccounts",
          "Wachtwoordbeleid en tweestapsverificatie",
          "Bijgewerkte versies en bekende kwetsbaarheden",
          "Beveiliging van back-ups",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>[Grootste risico]</strong> — [beschrijving en gevolg].",
          "<strong>Tweestapsverificatie</strong> — staat aan bij [aantal] van de [aantal] accounts.",
          "<strong>Oud-medewerkers</strong> — [aantal] accounts nog actief.",
          "<strong>Versies</strong> — [aantal] onderdelen met een bekende kwetsbaarheid.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Grootste risico] wegnemen — met voorrang",
          "Tweestapsverificatie verplichten",
          "Accounts van oud-medewerkers intrekken",
          "Vast moment voor het bijwerken van versies",
        ],
      },
      ...staart(
        ["Aanzienlijk kleiner risico op een incident", "Aantoonbaar beleid richting klanten"],
        ["Bespreken", "Grootste risico aanpakken", "Halfjaarlijks herhalen"],
      ),
    ]),
  },
  {
    key: "aud_continuiteit",
    naam: "E3 · Continuïteit",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "We hebben gekeken wat er bij {{bedrijf}} gebeurt als een systeem, leverancier of medewerker wegvalt. Op [aantal] plekken is er geen terugvaloptie.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Afhankelijkheid van afzonderlijke systemen en leveranciers",
          "Kennis die bij één persoon zit",
          "Back-ups en herstelprocedures",
          "Wat er gebeurt bij langdurige uitval",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Eén persoon</strong> — [proces] kan alleen door [rol] worden uitgevoerd.",
          "<strong>Eén leverancier</strong> — [dienst] heeft geen alternatief.",
          "<strong>Herstel</strong> — geschatte hersteltijd na uitval: [tijd].",
          "<strong>Beproefd</strong> — herstel is [wel/niet] ooit geoefend.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Proces] vastleggen en een tweede persoon inwerken",
          "Herstelprocedure opstellen en beproeven",
          "Alternatief onderzoeken voor [dienst]",
          "Jaarlijks een herstelproef",
        ],
      },
      ...staart(
        ["Hersteltijd van [X] naar [doel]", "Minder afhankelijk van personen"],
        ["Bespreken", "Vastleggen en inwerken", "Herstelproef plannen"],
      ),
    ]),
  },
  {
    key: "aud_leveranciers",
    naam: "E4 · Leveranciers en contracten",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "{{bedrijf}} heeft [aantal] doorlopende contracten voor software en diensten, samen [bedrag] per jaar. Daarvan wordt [aantal] nauwelijks of niet gebruikt.",
      },
      {
        kop: "Wat we onderzocht hebben",
        punten: [
          "Alle doorlopende contracten en abonnementen",
          "Werkelijk gebruik tegenover afgenomen licenties",
          "Opzegtermijnen en verlengingsdata",
          "Overlap tussen diensten",
        ],
      },
      {
        kop: "Bevindingen",
        punten: [
          "<strong>Ongebruikt</strong> — [bedrag] per jaar aan diensten die niemand gebruikt.",
          "<strong>Overlap</strong> — [dienst A] en [dienst B] doen grotendeels hetzelfde.",
          "<strong>Licenties</strong> — [aantal] afgenomen, [aantal] in gebruik.",
          "<strong>Verlenging</strong> — [aantal] contracten verlengen stilzwijgend.",
        ],
      },
      {
        kop: "Aanbevelingen",
        genummerd: [
          "[Bedrag] aan ongebruikte diensten opzeggen",
          "Kiezen tussen [dienst A] en [dienst B]",
          "Licenties terugbrengen naar het werkelijke aantal",
          "Verlengingsdata in de agenda zetten",
        ],
      },
      ...staart(
        ["[Bedrag] per jaar besparing", "Overzicht over wat er loopt"],
        ["Bespreken", "Opzeggingen vóór de verlengingsdata", "Jaarlijks doorlopen"],
      ),
    ]),
  },
  {
    key: "aud_nulmeting",
    naam: "E5 · Nulmeting vóór een traject",
    inhoud_html: doc([
      {
        kop: "Samenvatting",
        tekst:
          "Vóór de start van [traject] is de huidige situatie bij {{bedrijf}} vastgelegd. Dit verslag is het ijkpunt waartegen we het resultaat straks afmeten.",
      },
      {
        kop: "Wat we vastgelegd hebben",
        punten: [
          "Tijdsbesteding per proces, gemeten over [periode]",
          "Aantallen: orders, facturen, contactmomenten",
          "Foutpercentages en correcties",
          "Kosten van de huidige werkwijze",
        ],
      },
      {
        kop: "Uitgangssituatie",
        punten: [
          "<strong>Tijd</strong> — [X] uur per week aan [proces].",
          "<strong>Volume</strong> — [aantal] per [periode].",
          "<strong>Fouten</strong> — [X]%, ongeveer [aantal] correcties per [periode].",
          "<strong>Kosten</strong> — ongeveer [bedrag] per jaar.",
        ],
      },
      {
        kop: "Wat we gaan meten",
        genummerd: [
          "Dezelfde cijfers, [periode] na oplevering",
          "Tussenmeting halverwege",
          "Ervaring van de betrokken medewerkers",
        ],
      },
      ...staart(
        ["Doel: [X] uur per week terug", "Doel: foutpercentage naar [doel]%"],
        ["Verslag vaststellen", "Traject starten", "Nameting op [datum]"],
      ),
    ]),
  },
];
