/**
 * 25 belscripts voor de bellijst.
 *
 * Vijf blokken:
 *
 *   A. Koud bellen (1–6)        — de eerste seconden
 *   B. Kwalificeren (7–11)      — uitvragen wat er speelt
 *   C. Bezwaren (12–18)         — wat je zegt als het "nee" is
 *   D. Sluiten (19–23)          — afspraak, voorstel, akkoord
 *   E. Bestaande klanten (24–25)
 *
 * Deze scripts zijn geschreven om hardop te lezen, niet om te lezen:
 *
 *   - Wat tussen aanhalingstekens staat, zeg je letterlijk.
 *   - Wat ertussen staat is regie: wat je doet, waar je op let, wanneer je je
 *     mond houdt.
 *   - Na een vraag volgt stilte. Die stilte staat er expres. Niet invullen.
 *   - Nooit doorpraten na een "ja". Doorvragen, en dan de afspraak maken.
 *
 * Variabelen: {{voornaam}} {{bedrijf}} {{stad}} {{website}} — die vult het
 * dashboard in met de gegevens van de lead zodra je het script opent.
 */

export type Belscript = {
  key: string;
  naam: string;
  /** Het doel van dit gesprek — één zin, komt in het onderwerp-veld. */
  doel: string;
  tekst: string;
};

export const BELSCRIPTS: Belscript[] = [
  // ==========================================================================
  // A · Koud bellen
  // ==========================================================================
  {
    key: "bs_eerlijke_opening",
    naam: "A1 · De eerlijke opening",
    doel: "Toestemming krijgen om dertig seconden te pitchen",
    tekst:
      "OPENING — zeg dit rustig, niet gehaast:\n\n" +
      '"Goedemiddag {{voornaam}}, je spreekt met Tom van Viesa Automations. Ik val je koud — mag ik dertig seconden om te vertellen waarom ik bel, en dan zeg jij of het zin heeft?"\n\n' +
      "WACHT. Laat hem antwoorden. Bijna iedereen zegt ja, omdat je eerlijk was.\n\n" +
      "BIJ JA:\n\n" +
      '"Wij zorgen dat webshops en groothandels hun bestellingen niet meer met de hand hoeven over te tikken tussen hun shop, voorraad en boekhouding. Meestal loopt daar zes tot tien uur per week in weg.\n\n' +
      'Mijn vraag is simpel: gebeurt dat bij {{bedrijf}} ook nog met de hand?"\n\n' +
      "WACHT WEER. Dit is de vraag waar het gesprek op draait.\n\n" +
      "BIJ NEE OP DE OPENING:\n\n" +
      '"Helder. Bel ik beter een andere keer, of is het gewoon niets voor jullie?"\n\n' +
      "Dat onderscheid is belangrijk — het eerste is een nieuwe afspraak, het tweede is klaar.",
  },
  {
    key: "bs_pitch",
    naam: "A2 · De 30-secondenpitch",
    doel: "In één keer duidelijk maken wat we doen en waarom het hen raakt",
    tekst:
      "Letterlijk uit te spreken. Niet uitbreiden, niet versieren:\n\n" +
      '"Wij bouwen de koppelingen tussen de systemen die bedrijven al hebben. Dus je webshop, je voorraadsysteem en je boekhouding gaan met elkaar praten, zodat niemand meer iets hoeft over te tikken.\n\n' +
      "Wat dat oplevert is meestal hetzelfde verhaal: een dag per week aan handwerk verdwijnt, en de fouten die daarbij horen ook.\n\n" +
      'Wat ik van jou wil weten: hoeveel handwerk zit er nu tussen een binnenkomende bestelling bij {{bedrijf}} en het moment dat die de deur uitgaat?"\n\n' +
      "STOP HIER. Je hebt gezegd wat je moest zeggen.\n\n" +
      "Let op de drie fouten die je hier makkelijk maakt:\n" +
      "• Je noemt techniek (API's, integraties, middleware). Doe dat niet.\n" +
      "• Je noemt jullie eigen verhaal. Interesseert niemand in de eerste minuut.\n" +
      "• Je vult de stilte na je vraag. Laat hem denken.",
  },
  {
    key: "bs_receptie",
    naam: "A3 · Langs de receptie",
    doel: "Bij de juiste persoon terechtkomen zonder te worden afgehouden",
    tekst:
      "De telefoniste is er om te filteren. Werk mee, niet tegen.\n\n" +
      "REGEL 1 — vraag nooit om 'de directeur'. Dat is het signaal dat je verkoopt.\n" +
      "REGEL 2 — heb je een naam? Gebruik die alsof je hem kent.\n\n" +
      "MET NAAM:\n\n" +
      '"Goedemorgen, je spreekt met Tom van Viesa. Is [naam] er?"\n\n' +
      "Kort, rustig, geen uitleg. Uitleg klinkt als verkoop.\n\n" +
      "ZONDER NAAM:\n\n" +
      '"Goedemorgen, misschien kun je me helpen. Wie houdt zich bij jullie bezig met de systemen achter de webshop — de koppelingen met voorraad en boekhouding?"\n\n' +
      'BIJ "waar gaat het over":\n\n' +
      '"Over het automatiseren van de orderverwerking. Ik weet niet of het bij jullie speelt — daarom bel ik."\n\n' +
      'BIJ "stuur maar een mail":\n\n' +
      '"Dat doe ik. Naar wie mag ik het sturen, en wat is zijn of haar e-mailadres?"\n\n' +
      "Zo heb je alsnog een naam, en de volgende keer bel je die rechtstreeks.",
  },
  {
    key: "bs_voicemail",
    naam: "A4 · Voicemail inspreken",
    doel: "Teruggebeld worden zonder te verkopen",
    tekst:
      "Maximaal dertig seconden. Spreek langzaam, vooral je nummer.\n\n" +
      '"Hoi {{voornaam}}, Tom van Viesa Automations.\n\n' +
      "Ik bel over de orderverwerking bij {{bedrijf}} — ik zag iets op jullie site waar ik nieuwsgierig naar ben, en ik wilde weten of ik het goed zie.\n\n" +
      'Bel je me even terug? Nul-zes... [nummer langzaam, twee keer]. Nogmaals: nul-zes... Dank je."\n\n' +
      "Waarom dit werkt:\n" +
      "• Je noemt geen product. Er valt dus niets af te wijzen.\n" +
      "• 'Ik wilde weten of ik het goed zie' maakt nieuwsgierig.\n" +
      "• Je nummer twee keer, langzaam. Anders wordt er niet teruggebeld.\n\n" +
      "Spreek maximaal twee keer een voicemail in. Daarna mailen (sjabloon C3).",
  },
  {
    key: "bs_na_mail",
    naam: "A5 · Nabellen op je mail",
    doel: "Van een genegeerde mail alsnog een gesprek maken",
    tekst:
      "Bel twee tot drie dagen na de mail. Niet eerder.\n\n" +
      '"Hoi {{voornaam}}, met Tom van Viesa. Ik heb je dinsdag gemaild over [onderwerp] — waarschijnlijk ondergesneeuwd. Daarom bel ik even."\n\n' +
      "Nooit verwijtend, altijd luchtig. Zijn mailbox is niet jouw probleem.\n\n" +
      "METEEN DOOR NAAR DE KERN:\n\n" +
      '"Het ging hierover: [het concrete punt uit de mail, in één zin].\n\n' +
      'Speelt dat bij jullie, of zit ik ernaast?"\n\n' +
      'BIJ "ik heb hem niet gelezen":\n\n' +
      '"Geeft niet, dan doe ik het nu in dertig seconden." → door naar script A2.\n\n' +
      'BIJ "ik heb hem gezien maar het is niets":\n\n' +
      '"Dat mag. Mag ik één ding vragen: was het het onderwerp, of gewoon de timing?"\n\n' +
      "Dat antwoord bepaalt of je hem later terugbelt of definitief afsluit.",
  },
  {
    key: "bs_inbound",
    naam: "A6 · Nabellen op een aanvraag",
    doel: "Een warme aanvraag omzetten in een afspraak",
    tekst:
      "Bel binnen vijf minuten. Echt vijf minuten — dan zit hij nog op de site.\n\n" +
      '"Hoi {{voornaam}}, met Tom van Viesa Automations. Je hebt net het formulier ingevuld — ik dacht: ik bel gewoon even, dat gaat sneller dan mailen."\n\n' +
      "Dat 'net' doet het werk. Snelheid is hier je hele voordeel.\n\n" +
      "DAN DIRECT:\n\n" +
      '"Je schreef [wat hij invulde]. Vertel eens — wat gebeurde er waardoor je dit ging opzoeken?"\n\n' +
      "Die vraag is goud. Er is altijd een aanleiding: een fout die geld kostte, iemand die vertrekt, een systeem dat vastloopt. Die aanleiding is je hele verkoopverhaal.\n\n" +
      "LUISTEREN. Doorvragen op het moment waarop het misging.\n\n" +
      "AFRONDEN:\n\n" +
      '"Dit is goed te doen. Ik wil het even goed uitzoeken en je dan laten zien hoe het eruit zou zien. Heb je donderdagochtend een half uur, of komt vrijdagmiddag beter uit?"',
  },

  // ==========================================================================
  // B · Kwalificeren
  // ==========================================================================
  {
    key: "bs_ontdekking",
    naam: "B1 · Het ontdekkingsgesprek",
    doel: "In dertig minuten weten of dit een klant kan worden",
    tekst:
      "Acht vragen, in deze volgorde. Van breed naar pijnlijk.\n\n" +
      "1. \"Neem me eens mee: hoe loopt een bestelling bij {{bedrijf}} van binnenkomst tot verzending?\"\n" +
      "   → Laat hem vertellen. Onderbreek niet. Schrijf mee.\n\n" +
      '2. "Waar in dat verhaal moet iemand iets met de hand doen?"\n' +
      "   → Hier zitten jullie kansen.\n\n" +
      '3. "Hoeveel tijd kost dat per week, denk je?"\n' +
      "   → Vraag om een getal. Onthoud het, je hebt het straks nodig.\n\n" +
      '4. "En wat gaat er weleens mis?"\n' +
      "   → Fouten raken mensen sterker dan tijd. Doorvragen.\n\n" +
      '5. "Wat heeft die fout jullie toen gekost?"\n' +
      "   → Dit is het moment waarop het concreet wordt. Niet wegpoetsen.\n\n" +
      '6. "Hebben jullie eerder geprobeerd dit op te lossen?"\n' +
      "   → Zo ja: waarom is het toen niet gelukt? Dat gaat jou ook gebeuren.\n\n" +
      '7. "Stel dat het morgen opgelost is — wat verandert er dan bij jullie?"\n' +
      "   → Hij verkoopt het nu aan zichzelf. Laat hem praten.\n\n" +
      '8. "Wie moet er meekijken als jullie hiermee verder willen?"\n' +
      "   → De beslisser, zonder ernaar te vragen.\n\n" +
      "AFRONDEN — vat samen in zíjn woorden:\n\n" +
      '"Dus als ik het goed samenvat: [knelpunt], het kost jullie [tijd], en het gaat vooral mis bij [moment]. Klopt dat?"\n\n' +
      "Dat 'klopt dat' is belangrijk. Een ja hier is een ja op het probleem — en dat is de helft van de verkoop.",
  },
  {
    key: "bs_handwerk",
    naam: "B2 · Waar zit het handwerk",
    doel: "Het handmatige werk in uren en euro's krijgen",
    tekst:
      "Vraag door tot je een getal hebt. Vaag blijven is de valkuil.\n\n" +
      '"Wie doet dat overtikken bij jullie?"\n' +
      '"Hoeveel bestellingen per dag zijn dat ongeveer?"\n' +
      '"En hoe lang doet diegene over één bestelling?"\n\n' +
      "REKEN HET HARDOP VOOR — dit is het kantelpunt van het gesprek:\n\n" +
      "\"Dus als ik het even omreken: [aantal] per dag maal [minuten], dat is ruim [X] uur per week. Op jaarbasis zit je dan tegen de [Y] uur aan. Herken je dat, of valt het in de praktijk mee?\"\n\n" +
      "WACHT. Vaak komt hier: 'ja, en dan heb ik het nog niet over...' — precies waar je wilt zijn.\n\n" +
      "DOORVRAGEN OP DE FOUTEN:\n\n" +
      '"En als er dan een keer iets misgaat in dat overtikken — wat merkt de klant daarvan?"\n\n' +
      "Een misgelopen levering of een verkeerde factuur weegt in zijn hoofd zwaarder dan de uren. Gebruik dat later in je voorstel.",
  },
  {
    key: "bs_beslisser",
    naam: "B3 · Wie beslist er mee",
    doel: "De besluitvorming in kaart brengen zonder onbeleefd te zijn",
    tekst:
      "Vraag nooit 'ben jij degene die beslist'. Dat is beledigend en levert een leugen op.\n\n" +
      "VRAAG DIT:\n\n" +
      '"Als jullie hiermee verder zouden gaan — hoe gaat dat bij jullie? Wie kijkt er dan mee?"\n\n' +
      "Neutraal geformuleerd, en je krijgt het echte antwoord.\n\n" +
      "DOORVRAGEN:\n\n" +
      '"En wie let er dan vooral op de kosten?"\n' +
      '"Is er iemand die het technisch moet goedkeuren?"\n' +
      '"Hebben jullie dit soort dingen eerder gedaan? Hoe lang duurde dat toen ongeveer?"\n\n' +
      "DE BELANGRIJKSTE VRAAG, aan het eind:\n\n" +
      '"En als [naam beslisser] straks vraagt waarom jullie hiervoor kiezen — wat zeg jij dan?"\n\n' +
      "Als hij dat niet kan beantwoorden, heb je hem nog niet overtuigd. Dan is het te vroeg voor een voorstel — ga terug naar het probleem.",
  },
  {
    key: "bs_budget",
    naam: "B4 · Budget bespreekbaar maken",
    doel: "Weten of er geld is, vóór je een voorstel maakt",
    tekst:
      "Doe dit in het eerste gesprek. Een voorstel maken voor iemand zonder budget is verspilde tijd.\n\n" +
      "LEID IN MET DE KOSTEN VAN NIETS DOEN:\n\n" +
      '"We hadden het net over die [X] uur per week. Reken je dat door, dan kost dat jullie ongeveer [bedrag] per jaar — nog los van de fouten."\n\n' +
      "DAN DE BANDBREEDTE:\n\n" +
      '"Wat wij bouwen zit meestal tussen de [ondergrens] en [bovengrens], eenmalig, afhankelijk van hoeveel systemen er aan moeten hangen.\n\n' +
      'Is dat een bedrag waar jullie iets mee kunnen, of zit dat er ver naast?"\n\n' +
      "WACHT. Deze stilte voelt ongemakkelijk. Vul hem niet in.\n\n" +
      "DRIE MOGELIJKE ANTWOORDEN:\n\n" +
      '• "Dat kan wel" → door naar de afspraak. Je bent er bijna.\n' +
      '• "Dat is veel" → niet zakken. Vraag: "Wat had je in gedachten?" en kijk of je kleiner kunt beginnen (script C4).\n' +
      '• "Geen idee" → dan praat je met de verkeerde persoon. Terug naar script B3.',
  },
  {
    key: "bs_systemen",
    naam: "B5 · Systemen in kaart",
    doel: "Weten of we technisch kunnen leveren wat we beloven",
    tekst:
      "Saai maar noodzakelijk. Zonder dit maak je een voorstel dat je niet kunt waarmaken.\n\n" +
      '"Even een paar praktische dingen, dan weet ik of het kan."\n\n' +
      '• "Op welk platform draait jullie webshop?"\n' +
      '• "Welk boekhoudpakket gebruiken jullie?"\n' +
      '• "Houden jullie voorraad bij in een apart systeem, of in de shop?"\n' +
      '• "Zit er nu al iets tussen die systemen, of gaat alles met de hand?"\n' +
      '• "Wie beheert dat op dit moment — intern of een externe partij?"\n\n' +
      "DIE LAATSTE IS DE BELANGRIJKSTE. Zit er een bureau tussen, dan heb je straks hun medewerking nodig. Vraag door:\n\n" +
      '"Hoe loopt het met hen? Zouden zij hierin mee willen denken?"\n\n' +
      "AFRONDEN:\n\n" +
      '"Dit is allemaal goed te koppelen — daar hebben we ervaring mee. Ik ga het even precies uitzoeken en kom bij je terug."',
  },

  // ==========================================================================
  // C · Bezwaren
  // ==========================================================================
  {
    key: "bs_geen_interesse",
    naam: "C1 · \"Geen interesse\"",
    doel: "Onderscheiden of het een reflex is of een echt nee",
    tekst:
      "Dit komt bijna altijd in de eerste tien seconden. Het is meestal een reflex, geen oordeel.\n\n" +
      "NIET DOEN: doorpraten alsof je het niet hoorde. Dat maakt je een telemarketeer.\n\n" +
      "WEL DOEN — erken, dan één vraag:\n\n" +
      '"Dat snap ik, je weet nog niet waar ik voor bel. Eén vraag en dan laat ik je met rust:\n\n' +
      'worden bestellingen bij {{bedrijf}} nog met de hand overgezet naar de boekhouding?"\n\n' +
      "BIJ JA: \"Dát is waarvoor ik bel. Mag ik je daar dertig seconden over vertellen?\"\n\n" +
      "BIJ NEE: \"Dan bel ik voor niets, en dan hoor je verder niets van me. Fijne dag.\"\n\n" +
      "En dan ook echt ophangen. Dat is geen verlies — dat is je lijst schoonhouden. Bovendien: iemand die je netjes laat gaan, neemt over een jaar wél op.",
  },
  {
    key: "bs_stuur_mail",
    naam: "C2 · \"Stuur maar een mailtje\"",
    doel: "Van een afscheping alsnog een gesprek of een echte afspraak maken",
    tekst:
      "Het meest voorkomende bezwaar, en zelden een echt verzoek. Meestal betekent het: ik wil dit gesprek beëindigen.\n\n" +
      "GA MEE, MAAR STEL ÉÉN VOORWAARDE:\n\n" +
      '"Doe ik. Dan wil ik wel weten wat ik erin moet zetten, anders stuur ik je een folder en daar heb je niets aan.\n\n' +
      'Twee vragen: gaat het overtikken van bestellingen bij jullie met de hand, en hoeveel tijd kost dat ongeveer?"\n\n' +
      "Dat is geen truc — het is waar. En je zit weer in een gesprek.\n\n" +
      "GEEFT HIJ ANTWOORD? Dan heb je alsnog je kwalificatie. Rond af met:\n\n" +
      '"Helder. Ik stuur je vandaag iets concreets hierover. Mag ik je volgende week even bellen om te horen wat je ervan vond?"\n\n' +
      "Vraag om die toestemming. Dan is je volgende belletje afgesproken in plaats van koud.\n\n" +
      "HOUDT HIJ VOET BIJ STUK? Stuur de mail, echt waar, en zet een follow-up over vijf dagen.",
  },
  {
    key: "bs_geen_tijd",
    naam: "C3 · \"Nu even geen tijd\"",
    doel: "Een concreet nieuw moment vastleggen",
    tekst:
      "Dit is vaak waar. Behandel het dus niet als bezwaar — behandel het als planning.\n\n" +
      "NIET VRAGEN: \"wanneer komt het wel uit?\" Dat levert 'bel maar eens een keer' op.\n\n" +
      "WEL DOEN — twee opties geven:\n\n" +
      '"Geen probleem. Ik bel liever kort dan lang: schikt morgenochtend rond negen uur, of is later in de week beter?"\n\n' +
      "Twee opties is makkelijker beantwoorden dan een open vraag.\n\n" +
      "BIJ EEN TIJDSTIP: leg het vast in het dashboard als follow-up, en zeg het hardop:\n\n" +
      '"Genoteerd, dan bel ik je donderdag om tien uur. Dan houd ik het bij een kwartier."\n\n' +
      "BIJ AANHOUDENDE VAAGHEID — één keer testen of het echt aan de tijd ligt:\n\n" +
      '"Mag ik eerlijk zijn? Als het gewoon niets voor jullie is, zeg dat dan gerust. Dan bel ik je niet nog eens."\n\n' +
      "Dat levert vrijwel altijd het eerlijke antwoord op.",
  },
  {
    key: "bs_te_duur",
    naam: "C4 · \"Te duur\"",
    doel: "De prijs naast de kosten van niets doen leggen",
    tekst:
      "Zak nooit direct in prijs. Wie meteen zakt, geeft toe dat de eerste prijs verzonnen was.\n\n" +
      "EERST UITZOEKEN WAT HIJ BEDOELT:\n\n" +
      '"Dat mag je zeggen. Bedoel je dat het meer is dan je had verwacht, of dat het budget er nu simpelweg niet is?"\n\n' +
      "Dat zijn twee heel verschillende gesprekken.\n\n" +
      "BIJ 'MEER DAN VERWACHT' — de rekensom terug:\n\n" +
      '"Even naast elkaar: we hadden het over [X] uur per week aan overtikken. Dat is ongeveer [bedrag] per jaar aan loon, en dan reken ik de fouten niet mee.\n\n' +
      'Wat wij bouwen is eenmalig [bedrag] en draait daarna vanzelf. Grofweg is dat binnen [periode] terugverdiend. Zie jij dat anders?"\n\n' +
      "BIJ 'GEEN BUDGET' — kleiner maken, niet goedkoper:\n\n" +
      '"Dan doen we het anders. We beginnen met alleen [kleinste blok], voor [vast bedrag]. Dat staat op zichzelf en levert meteen [resultaat] op. Werkt dat, dan kijken we verder — en zo niet, dan heb je in elk geval dat stuk werkend."\n\n' +
      "Dat is geen korting. Dat is een kleinere eerste stap, en dat is een wezenlijk verschil.",
  },
  {
    key: "bs_al_bureau",
    naam: "C5 · \"We hebben al een bureau\"",
    doel: "Naast de bestaande partij gaan staan in plaats van ertegenin",
    tekst:
      "Val hun huidige partij nooit af. Dan val je hun eigen keuze af, en dan verlies je.\n\n" +
      "BEVESTIG EERST:\n\n" +
      '"Goed dat jullie dat geregeld hebben. Wie doet dat voor jullie?"\n\n' +
      "Oprecht geïnteresseerd. Je leert er bovendien iets van.\n\n" +
      "DAN HET ONDERSCHEID:\n\n" +
      '"Wat zij doen — de webshop zelf, de vormgeving, de campagnes — dat doen wij niet. Wij zitten aan de andere kant: alles achter de shop. De koppelingen met voorraad en boekhouding, en het handwerk dat daar nog omheen zit.\n\n' +
      'De meeste bureaus doen dat niet. Dat is geen kritiek, het is gewoon een ander vak."\n\n' +
      "DAN DE VRAAG DIE ERTOE DOET:\n\n" +
      '"Even los van hen: wordt er bij jullie nog met de hand overgetikt tussen de shop en de boekhouding?"\n\n' +
      "BIJ JA: dan is dat jouw terrein, en dat van hen niet. Ga verder.\n" +
      "BIJ NEE: dan zit het goed, en zeg je dat ook. Vraag of je over een jaar nog eens mag bellen.",
  },
  {
    key: "bs_doen_we_zelf",
    naam: "C6 · \"Dat doen we zelf\"",
    doel: "Het risico van intern bouwen zichtbaar maken",
    tekst:
      "Meestal is er één handige medewerker die iets in elkaar heeft gezet. Complimenteer dat — het is vaak knap werk.\n\n" +
      '"Mooi dat jullie dat intern kunnen. Wie heeft dat gebouwd?"\n\n' +
      "LUISTEREN. Dan de vraag die het gesprek opent:\n\n" +
      '"En als diegene twee weken op vakantie is en er gaat iets stuk — wie lost het dan op?"\n\n' +
      "WACHT. Dit is bijna altijd stil aan de andere kant, want hier heeft niemand een goed antwoord op.\n\n" +
      "DOORVRAGEN:\n\n" +
      '"Is het gedocumenteerd?"\n' +
      '"Hoeveel van zijn tijd gaat er nu op aan onderhoud in plaats van aan zijn eigen werk?"\n\n' +
      "POSITIONEREN — niet als vervanger, maar als vangnet:\n\n" +
      '"Wij hoeven het niet over te nemen. Waar we vaak binnenkomen is dat we het overnemen wat af is, zodat jullie eigen mensen weer aan hun eigen werk toekomen. En dan ligt het niet meer bij één persoon.\n\n' +
      'Zou dat wat zijn?"',
  },
  {
    key: "bs_later",
    naam: "C7 · \"Bel over een halfjaar\"",
    doel: "Vastleggen wat er dan anders moet zijn",
    tekst:
      "Ga mee, maar niet zonder inhoud. 'Bel later maar' zonder afspraak is een beleefd nee.\n\n" +
      "AANVAARDEN, DAN DOORVRAGEN:\n\n" +
      '"Prima, dan bel ik je in [maand]. Eén ding wil ik dan wel weten, anders bel ik weer voor niets:\n\n' +
      'wat moet er tegen die tijd anders zijn wil dit wél kunnen?"\n\n' +
      "WACHT OP HET ECHTE ANTWOORD. Er zijn er drie mogelijk:\n\n" +
      '• "Budget voor volgend jaar" → concreet. Vraag wanneer die begroting rondkomt en bel twee weken daarvóór, niet erna.\n' +
      '• "Eerst [ander project] afronden" → concreet. Vraag wanneer dat klaar is.\n' +
      '• "Gewoon even kijken hoe het loopt" → dat is geen reden. Test het:\n\n' +
      '  "Mag ik eerlijk zijn? Dat klinkt alsof het gewoon niet hoog op de lijst staat. Dat mag — dan bel ik je niet meer, en meld je je als het gaat spelen."\n\n' +
      "AFRONDEN — leg het hardop vast:\n\n" +
      '"Dan noteer ik: bellen in [maand], en dan is [voorwaarde] rond. Tot dan."\n\n' +
      "Zet het meteen als follow-up in het dashboard, met die voorwaarde in de notitie.",
  },

  // ==========================================================================
  // D · Sluiten
  // ==========================================================================
  {
    key: "bs_afspraak",
    naam: "D1 · De afspraak vastzetten",
    doel: "Een concreet moment in beide agenda's krijgen",
    tekst:
      "Vraag nooit óf hij een afspraak wil. Vraag wanneer.\n\n" +
      "SAMENVATTEN, DAN VOORSTELLEN:\n\n" +
      '"Dus [knelpunt] kost jullie ongeveer [tijd] per week, en het gaat vooral mis bij [moment].\n\n' +
      "Dat is precies wat wij bouwen. Ik wil je laten zien hoe dat er voor {{bedrijf}} uit zou zien — dat is een half uur.\n\n" +
      'Schikt donderdagochtend, of is vrijdagmiddag beter?"\n\n' +
      "TWEE OPTIES. Niet drie, niet open.\n\n" +
      "ZODRA HIJ KIEST — meteen vastleggen, terwijl je aan de lijn bent:\n\n" +
      '"Genoteerd. Ik stuur je nu meteen een uitnodiging, dan staat het bij ons allebei. Op welk e-mailadres?"\n\n' +
      "Doe dat ook echt tijdens het gesprek. Een afspraak die niet in de agenda staat, bestaat niet.\n\n" +
      "AFRONDEN MET DE VOORBEREIDING:\n\n" +
      '"Als je vóór donderdag even kunt nakijken hoeveel bestellingen jullie gemiddeld per dag doen, dan kan ik het meteen doorrekenen."\n\n' +
      "Een kleine opdracht verhoogt de opkomst aanzienlijk.",
  },
  {
    key: "bs_herinnering",
    naam: "D2 · Het herinneringsbelletje",
    doel: "Voorkomen dat de afspraak niet doorgaat",
    tekst:
      "De dag ervoor, eind van de ochtend. Kort houden.\n\n" +
      '"Hoi {{voornaam}}, Tom van Viesa. We spreken elkaar morgen om [tijd] — ik bel even of dat nog steeds uitkomt."\n\n' +
      "Geef hem eerlijk de ruimte om te verzetten. Een verzette afspraak is oneindig veel beter dan een lege agenda.\n\n" +
      "GEEF HEM EEN REDEN OM ERNAAR UIT TE KIJKEN:\n\n" +
      '"Ik heb inmiddels even naar {{website}} gekeken en twee dingen gevonden die je waarschijnlijk interessant vindt. Neem ik morgen mee."\n\n' +
      "AFRONDEN:\n\n" +
      '"Tot morgen om [tijd]. Ik bel je op dit nummer."\n\n' +
      "MOET HET VERZET? Doe dat direct aan de telefoon, niet per mail:\n\n" +
      '"Geen probleem. Volgende week dinsdag zelfde tijd?"',
  },
  {
    key: "bs_audit_terug",
    naam: "D3 · De audit doorbellen",
    doel: "Bevindingen toelichten en naar de vervolgstap bewegen",
    tekst:
      "Mail het verslag nooit zonder het te bespreken. Dan wordt het gescand en vergeten.\n\n" +
      "OPENEN MET DE BELANGRIJKSTE BEVINDING, niet met een inleiding:\n\n" +
      '"We hebben naar {{bedrijf}} gekeken. Het belangrijkste eerst: [grootste bevinding]. Dat kost jullie naar schatting [impact]."\n\n' +
      "STIL ZIJN. Laat hem reageren. Zijn reactie vertelt je of hij het herkent.\n\n" +
      "DAN DE REST, KORT:\n\n" +
      '"Daarnaast zagen we [tweede] en [derde]. Die zijn kleiner, maar goed mee te nemen."\n\n' +
      "TOETSEN:\n\n" +
      '"Herken je dit beeld, of zie jij het anders van binnenuit?"\n\n' +
      "Neem dat antwoord serieus — hij weet dingen die jij van buitenaf niet kunt zien.\n\n" +
      "NAAR DE VERVOLGSTAP:\n\n" +
      '"Wat mij betreft pakken we [grootste bevinding] als eerste aan. Ik werk uit wat dat kost en hoe lang het duurt, en stuur je dat deze week.\n\n' +
      'Wanneer heb je tijd om het door te nemen?"',
  },
  {
    key: "bs_voorstel_na",
    naam: "D4 · Het voorstel nabellen",
    doel: "Het echte bezwaar boven tafel krijgen",
    tekst:
      "Bel twee tot drie dagen na het versturen. En vraag niet of hij het heeft kunnen bekijken — daar krijg je 'nog niet aan toegekomen' op.\n\n" +
      "STEL DEZE VRAAG:\n\n" +
      '"Hoi {{voornaam}}, Tom van Viesa. Je hebt het voorstel binnen. Ik ben benieuwd: welk onderdeel sprak je het minst aan?"\n\n' +
      "Dat is de hele truc. Je vraagt naar het bezwaar in plaats van naar het oordeel, en dan krijg je een eerlijk antwoord in plaats van beleefdheid.\n\n" +
      "DRIE VEELVOORKOMENDE ANTWOORDEN:\n\n" +
      '• De prijs → script C4.\n' +
      '• De doorlooptijd → "Wat zou wél werken? We kunnen [onderdeel] naar voren halen."\n' +
      '• "Of het technisch gaat werken" → bied een test aan: "Zullen we met één koppeling beginnen en die eerst laten draaien?"\n\n' +
      "BIJ 'IK MOET HET NOG INTERN BESPREKEN':\n\n" +
      '"Helder. Met wie bespreek je het, en waar let diegene vooral op?"\n\n' +
      "Daarna: \"Zal ik daar een korte samenvatting voor maken die je kunt doorsturen?\" Dan bepaal jij wat er in die vergadering gezegd wordt.",
  },
  {
    key: "bs_akkoord",
    naam: "D5 · Akkoord halen",
    doel: "Van 'interessant' naar een handtekening",
    tekst:
      "Op enig moment moet je het gewoon vragen. De meeste deals stranden omdat niemand de vraag stelt.\n\n" +
      "EERST HET LAATSTE BEZWAAR OPZOEKEN:\n\n" +
      '"Even eerlijk: is er nog iets waardoor je twijfelt, of zijn we het eens?"\n\n' +
      "WACHT. Komt er iets? Los dat eerst op. Komt er niets, dan vraag je het:\n\n" +
      '"Dan stel ik voor dat we beginnen. Ik stuur je vanmiddag de opdrachtbevestiging, en dan kunnen we [datum] starten. Akkoord?"\n\n' +
      "STIL ZIJN. Wie na de vraag doorpraat, praat de deal weer weg.\n\n" +
      "MAAK DE VOLGENDE STAP CONCREET:\n\n" +
      '"Dan doe ik dit: bevestiging vanmiddag, jij tekent digitaal, en dan plannen we de startsessie in de week van [datum]. Daar wil ik graag [wie] bij hebben.\n\n' +
      'Klopt dat zo?"\n\n' +
      "BIJ TWIJFEL — geef hem een uitweg zonder de deal te verliezen:\n\n" +
      '"Wil je er nog een nacht over slapen? Dan bel ik je morgen om deze tijd."\n\n' +
      "En bel dan ook echt.",
  },

  // ==========================================================================
  // E · Bestaande klanten
  // ==========================================================================
  {
    key: "bs_check_in",
    naam: "E1 · Check-in na oplevering",
    doel: "Tevredenheid toetsen, en een review of uitbreiding ophalen",
    tekst:
      "Bel twee weken na livegang. Niet mailen — bellen. Dit gesprek levert reviews, verlengingen en doorverwijzingen op.\n\n" +
      '"Hoi {{voornaam}}, Tom van Viesa. [Wat we opleverden] draait nu twee weken. Ik bel niet voor iets — ik wil gewoon weten hoe het bevalt."\n\n' +
      "Dat 'ik bel niet voor iets' ontspant het gesprek meteen.\n\n" +
      "DRIE VRAGEN:\n\n" +
      '1. "Doet het wat je ervan verwachtte?"\n' +
      '2. "Merkt het team het verschil in de praktijk?"\n' +
      '3. "Is er iets wat nu irritant of onhandig is?"\n\n' +
      "Die derde is de belangrijkste. Er is altijd iets, en als jij er niet naar vraagt hoor je het pas als het te laat is.\n\n" +
      "BIJ TEVREDENHEID — vraag om iets terug:\n\n" +
      '"Fijn om te horen. Mag ik je iets vragen: zou je daar een paar zinnen over willen zeggen die wij mogen gebruiken? Kost je twee minuten."\n\n' +
      "EN DAN DE DOORVERWIJZING:\n\n" +
      '"En ken je iemand bij wie ditzelfde speelt? Ik bel liever iemand met jouw naam erbij dan koud."',
  },
  {
    key: "bs_factuur",
    naam: "E2 · Factuur nabellen",
    doel: "Een concrete betaalafspraak maken zonder de relatie te schaden",
    tekst:
      "Vriendelijk, feitelijk, en niet verontschuldigend. Je vraagt niet om een gunst — je vraagt om wat is afgesproken.\n\n" +
      "OPENEN ZONDER BESCHULDIGING:\n\n" +
      '"Hoi {{voornaam}}, Tom van Viesa. Ik bel over factuur [nummer] van [datum] — die staat bij ons nog open. Ik wilde even checken of hij goed is aangekomen."\n\n' +
      "Geef hem een eervolle uitweg. Vaak is het gewoon blijven liggen.\n\n" +
      "BIJ 'DIE HEB IK NIET GEZIEN':\n\n" +
      '"Kan gebeuren. Ik stuur hem nu opnieuw — naar welk adres het beste?"\n\n' +
      "BIJ 'DIE STAAT KLAAR':\n\n" +
      '"Mooi. Wanneer gaat de betaling er ongeveer uit?"\n\n' +
      "Vraag om een datum. Zonder datum gebeurt het niet.\n\n" +
      "BIJ EEN PROBLEEM — doorvragen, niet aandringen:\n\n" +
      '"Is er iets waardoor het niet lukt? Zeg het gerust, dan kijken we of we er samen uitkomen."\n\n' +
      "AFRONDEN — altijd met een datum en een bevestiging:\n\n" +
      '"Dan noteer ik [datum]. Ik stuur je zo een mailtje met de factuur erbij, dan heb je alles bij elkaar. Bedankt."',
  },
];
