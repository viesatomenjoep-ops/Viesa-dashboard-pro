/** Herbruikbare e-mailsjablonen voor het dashboard. Onderwerp + platte tekst;
 *  de tekst wordt bij verzenden in de huisstijl-HTML gewikkeld.
 *
 *  Toon: hoogstaand, enterprise-IT, warm en concreet. Gebruik [naam], [bedrijf]
 *  en [website] als plaatshouders — die vul je vóór verzenden in. */

export type MailTemplate = {
  key: string;
  naam: string;
  onderwerp: string;
  tekst: string;
};

const GROET = "Met vriendelijke groet,\nTom & Joep\nViesa Automations\nwww.viesa-automations.nl";

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    key: "leeg",
    naam: "Leeg bericht",
    onderwerp: "",
    tekst: "",
  },

  // 1 — We hebben je gezien
  {
    key: "gezien",
    naam: "1 · We hebben je gezien",
    onderwerp: "Wat ons opviel aan [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "We kwamen [bedrijf] tegen en het viel ons meteen op: jullie hebben een sterk product en een duidelijke propositie. Precies het soort organisatie waar wij graag mee werken.\n\n" +
      "Bij Viesa maken we webshops slimmer en mobieler. We combineren technische e-commerce-expertise met slimme automatisering — geen statische website, maar een systeem dat je bedrijfsvoering versterkt en werk uit handen neemt.\n\n" +
      "Ik ben benieuwd: staat het optimaliseren van jullie online-omgeving dit jaar op de agenda? Dan denk ik graag vrijblijvend met je mee.\n\n" +
      GROET,
  },

  // 2 — Gevonden op Google
  {
    key: "google",
    naam: "2 · Gevonden op Google",
    onderwerp: "Via Google bij [bedrijf] terechtgekomen",
    tekst:
      "Beste [naam],\n\n" +
      "We vonden [bedrijf] via Google terwijl we naar sterke spelers in jullie branche zochten. Jullie vielen op — en dat maakte ons nieuwsgierig naar hoe jullie online-omgeving nu presteert.\n\n" +
      "Wij helpen bedrijven zoals dat van jou om hun webshop om te zetten naar een volwaardige mobiele app, klantcontact te automatiseren met AI-agents, en handmatige taken te laten verdwijnen via workflow-automatisering.\n\n" +
      "Zou een korte, vrijblijvende scan van jullie situatie interessant zijn? Dan laten we concreet zien waar de winst zit.\n\n" +
      GROET,
  },

  // 3 — Audit-uitnodiging
  {
    key: "audit_uitnodiging",
    naam: "3 · Uitnodiging gratis audit",
    onderwerp: "Een gratis audit voor [bedrijf]?",
    tekst:
      "Beste [naam],\n\n" +
      "We zijn benieuwd of je openstaat voor een gratis audit van jullie online-omgeving. In die audit brengen we in kaart waar [bedrijf] snelheid, omzet en efficiëntie laat liggen — en hoe je dat terugwint.\n\n" +
      "Je ontvangt van ons een helder auditverslag met:\n" +
      "• concrete bevindingen over je webshop en processen;\n" +
      "• kansen voor een mobiele app, AI-klantcontact en automatisering;\n" +
      "• een prioriteitenlijst met verwachte impact.\n\n" +
      "Vrijblijvend, en je houdt het verslag sowieso. Zullen we een moment inplannen?\n\n" +
      GROET,
  },

  // 4 — We kunnen veel betekenen
  {
    key: "waarde",
    naam: "4 · We kunnen veel betekenen",
    onderwerp: "Waar wij het verschil maken voor [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "We denken dat we veel voor [bedrijf] kunnen betekenen. Niet met een nieuwe website, maar met een platform dat staat als een huis en zichzelf continu optimaliseert.\n\n" +
      "Wat dat concreet oplevert:\n" +
      "• App-ontwikkeling: je webshop als volwaardige mobiele app, optimaal op elk apparaat.\n" +
      "• Slimme AI-agents: chatbots en Voice AI die klanten 24/7 professioneel te woord staan.\n" +
      "• Workflow-automatisering: systemen die met elkaar praten, zodat handmatig werk verdwijnt en je data altijd klopt.\n" +
      "• Intelligente kennisbank: jouw bedrijfs- en productkennis als bron voor AI die antwoorden geeft die écht bij je passen.\n\n" +
      "Via onze partnership met Commerced combineren we onze techniek met diepgaande e-commerce-architectuurkennis.\n\n" +
      "Zullen we 20 minuten bellen om te kijken wat de grootste kans voor jullie is?\n\n" +
      GROET,
  },

  // 5 — Wie zijn wij
  {
    key: "wie",
    naam: "5 · Wie zijn wij (introductie)",
    onderwerp: "Even voorstellen — Viesa Automations",
    tekst:
      "Beste [naam],\n\n" +
      "Even kort wie wij zijn. Viesa Automations maakt webshops slimmer en mobieler. We bouwen geen statische websites, maar systemen die je bedrijfsvoering versterken en werk uit handen nemen.\n\n" +
      "Onze aanpak in het kort:\n" +
      "• We zetten je webshop om naar een volwaardige mobiele app.\n" +
      "• We bouwen AI-agents (chat en voice) voor 24/7 klantcontact.\n" +
      "• We automatiseren workflows, zodat processen vanzelf lopen.\n" +
      "• We ontsluiten je kennis in een intelligente kennisbank.\n\n" +
      "Samen met onze partner Commerced leveren we een schaalbaar platform dat zichzelf blijft optimaliseren.\n\n" +
      "Ik vertel je er graag meer over — past een korte kennismaking deze of volgende week?\n\n" +
      GROET,
  },

  // 6 — Follow-up 1
  {
    key: "followup1",
    naam: "6 · Follow-up (1e herinnering)",
    onderwerp: "Even terugkomen op mijn bericht",
    tekst:
      "Beste [naam],\n\n" +
      "Ik kom nog even terug op mijn vorige bericht. Ik snap dat het druk is — daarom houd ik het kort.\n\n" +
      "Zou een vrijblijvende audit van jullie online-omgeving interessant zijn? Je krijgt een concreet beeld van de kansen voor [bedrijf], zonder verplichtingen.\n\n" +
      "Laat gerust weten of het je aanspreekt, dan plan ik een moment in.\n\n" +
      GROET,
  },

  // 7 — Follow-up 2 (laatste)
  {
    key: "followup2",
    naam: "7 · Follow-up (laatste)",
    onderwerp: "Laatste keer dat ik je hierover mail",
    tekst:
      "Beste [naam],\n\n" +
      "Ik wil je niet blijven mailen, dus dit is mijn laatste bericht hierover. Mocht optimalisatie van jullie webshop, klantcontact of processen op een later moment spelen, dan hoor ik het graag — de deur staat open.\n\n" +
      "Succes met alles bij [bedrijf], en wie weet tot later.\n\n" +
      GROET,
  },

  // 8 — Afspraak bevestigen
  {
    key: "afspraak",
    naam: "8 · Afspraak bevestigen",
    onderwerp: "Bevestiging van onze afspraak",
    tekst:
      "Beste [naam],\n\n" +
      "Fijn dat we een moment hebben ingepland. Hierbij bevestig ik onze afspraak op [datum] om [tijd].\n\n" +
      "Ik zorg dat we goed voorbereid zijn en kom met een paar concrete ideeën voor [bedrijf]. Mocht het onverhoopt niet uitkomen, laat het tijdig weten, dan plannen we opnieuw.\n\n" +
      "Tot dan!\n\n" +
      GROET,
  },

  // 9 — Auditverslag nasturen
  {
    key: "audit_verslag",
    naam: "9 · Auditverslag nasturen",
    onderwerp: "Jullie auditverslag van Viesa Automations",
    tekst:
      "Beste [naam],\n\n" +
      "Bedankt voor je tijd. Zoals beloofd stuur ik je hierbij het auditverslag van [bedrijf].\n\n" +
      "In het verslag vind je onze bevindingen, de belangrijkste kansen en een prioriteitenlijst met verwachte impact. De grootste winst zit wat ons betreft in [kans].\n\n" +
      "Ik loop het graag met je door en licht toe hoe we dit stap voor stap kunnen aanpakken. Wanneer schikt het?\n\n" +
      GROET,
  },

  // 10 — Offerte nasturen
  {
    key: "offerte",
    naam: "10 · Offerte nasturen",
    onderwerp: "Jullie offerte van Viesa Automations",
    tekst:
      "Beste [naam],\n\n" +
      "Bedankt voor het prettige gesprek. Zoals besproken stuur ik je hierbij onze offerte voor [bedrijf].\n\n" +
      "De offerte is opgebouwd rond de kansen die we samen bespraken, met een heldere fasering en verwachte resultaten. Heb je vragen of wil je iets aanpassen? Laat het gerust weten, dan denk ik graag mee.\n\n" +
      "Ik hoor graag wat je ervan vindt.\n\n" +
      GROET,
  },

  // 11 — Reactie op website-aanvraag
  {
    key: "reactie",
    naam: "11 · Reactie op aanvraag",
    onderwerp: "Bedankt voor je aanvraag bij Viesa",
    tekst:
      "Beste [naam],\n\n" +
      "Bedankt voor je bericht en je interesse in Viesa Automations. Leuk dat je contact opneemt!\n\n" +
      "Om je zo goed mogelijk te helpen: zou je kort kunnen toelichten wat je precies zoekt en wat op dit moment het grootste knelpunt is? Dan kom ik snel bij je terug met een concreet voorstel.\n\n" +
      GROET,
  },

  // 12 — Factuurherinnering
  {
    key: "factuurherinnering",
    naam: "12 · Factuurherinnering",
    onderwerp: "Vriendelijke herinnering — openstaande factuur",
    tekst:
      "Beste [naam],\n\n" +
      "Uit onze administratie blijkt dat de factuur met nummer [nummer] nog openstaat. Mogelijk is dit aan je aandacht ontsnapt.\n\n" +
      "Wil je de betaling alsnog in orde maken? Is de factuur al voldaan, dan kun je dit bericht als niet verzonden beschouwen.\n\n" +
      GROET,
  },

  // 13 — We hebben je gezien (variant kort & direct)
  {
    key: "gezien_kort",
    naam: "13 · We hebben je gezien (kort)",
    onderwerp: "Kort vraagje over [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "[bedrijf] viel ons op. Eén concrete vraag: staat het slimmer en mobieler maken van jullie webshop dit jaar op de planning?\n\n" +
      "Zo ja, dan laat ik je in 15 minuten zien waar de grootste winst zit. Zo nee, dan hoor je verder niets van me.\n\n" +
      GROET,
  },

  // 14 — Gevonden op Google (variant branchespecifiek)
  {
    key: "google_branche",
    naam: "14 · Gevonden op Google (branche)",
    onderwerp: "Opgevallen in jullie branche",
    tekst:
      "Beste [naam],\n\n" +
      "Bij het verkennen van sterke spelers in jullie branche kwamen we [bedrijf] tegen. We zien in deze markt keer op keer dezelfde kans: klanten verwachten een razendsnelle, mobiele ervaring en direct antwoord — 24/7.\n\n" +
      "Precies daar zijn wij goed in: een mobiele app van je webshop, AI-agents voor klantcontact en automatisering die handwerk wegneemt.\n\n" +
      "Zal ik een korte scan doen en de 3 grootste kansen voor [bedrijf] delen?\n\n" +
      GROET,
  },

  // 15 — App-ontwikkeling (specifiek)
  {
    key: "app",
    naam: "15 · Focus: mobiele app",
    onderwerp: "Van webshop naar app voor [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "Steeds meer omzet komt via mobiel. Toch draaien veel webshops nog op een site die op een telefoon 'meekan' in plaats van te schitteren.\n\n" +
      "Wij zetten jouw bestaande webshop om naar een volwaardige mobiele app: sneller, met pushberichten en een ervaring die klanten laat terugkomen. Alles gekoppeld aan je huidige systemen.\n\n" +
      "Benieuwd hoe dat er voor [bedrijf] uit zou zien? Ik maak graag een korte schets.\n\n" +
      GROET,
  },

  // 16 — AI-agents (specifiek)
  {
    key: "ai",
    naam: "16 · Focus: AI-agents (chat & voice)",
    onderwerp: "24/7 klantcontact voor [bedrijf], zonder extra personeel",
    tekst:
      "Beste [naam],\n\n" +
      "Stel: elke klantvraag bij [bedrijf] wordt direct, professioneel en in jullie tone-of-voice beantwoord — dag en nacht, zonder wachttijd.\n\n" +
      "Dat bouwen wij met slimme AI-agents: chatbots en Voice AI die je klanten te woord staan, gevoed door jullie eigen kennisbank. Zo krijgen klanten antwoorden die écht kloppen, en houdt je team tijd over voor het echte werk.\n\n" +
      "Zal ik laten zien hoe zo'n agent voor jullie zou werken?\n\n" +
      GROET,
  },

  // 17 — Workflow-automatisering (specifiek)
  {
    key: "automatisering",
    naam: "17 · Focus: workflow-automatisering",
    onderwerp: "Handmatig werk wegnemen bij [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "Veel bedrijven verliezen uren aan handmatig overtikken, kopiëren en controleren tussen systemen. Herkenbaar?\n\n" +
      "Wij koppelen jullie systemen aan elkaar, zodat handmatige taken verdwijnen, data altijd klopt en processen automatisch lopen. Minder fouten, meer tijd, een organisatie die schaalt.\n\n" +
      "Ik breng graag in kaart welke processen bij [bedrijf] zich als eerste lenen voor automatisering.\n\n" +
      GROET,
  },

  // 18 — Oude lead opnieuw benaderen
  {
    key: "reengage",
    naam: "18 · Oude lead opnieuw benaderen",
    onderwerp: "Nog steeds nieuwsgierig naar [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "Een tijd geleden hadden we contact over het slimmer maken van jullie online-omgeving. De timing was toen misschien niet ideaal — daarom kom ik er nog eens op terug.\n\n" +
      "Er is sindsdien veel mogelijk geworden, zeker op het vlak van mobiele apps en AI-klantcontact. Is het interessant om vrijblijvend bij te praten en te kijken wat er nu voor [bedrijf] speelt?\n\n" +
      GROET,
  },

  // 19 — Na kennismaking (bedankt + samenvatting)
  {
    key: "na_kennismaking",
    naam: "19 · Bedankt na kennismaking",
    onderwerp: "Fijn gesprek — en de vervolgstappen",
    tekst:
      "Beste [naam],\n\n" +
      "Bedankt voor het prettige gesprek. Kort samengevat wat we bespraken:\n" +
      "• Uitdaging: [uitdaging].\n" +
      "• Kans: [oplossing/richting].\n" +
      "• Vervolg: [vervolgstap].\n\n" +
      "Ik pak [actie] op en kom uiterlijk [datum] bij je terug. Mocht er nog iets zijn, laat het gerust weten.\n\n" +
      GROET,
  },

  // 20 — Partnership / samenwerking (Commerced-kracht)
  {
    key: "partnership",
    naam: "20 · Samenwerking & expertise",
    onderwerp: "Techniek én e-commerce-kennis voor [bedrijf]",
    tekst:
      "Beste [naam],\n\n" +
      "Wat ons anders maakt: we combineren technische kracht met diepgaande e-commerce-kennis. Via onze partnership met Commerced kijken we niet alleen naar de techniek, maar naar de héle architectuur achter jullie webshop.\n\n" +
      "Het resultaat is een schaalbaar platform dat staat als een huis en zichzelf continu optimaliseert — geen los projectje, maar een fundament.\n\n" +
      "Ik vertel je graag hoe we dat voor [bedrijf] zouden aanpakken.\n\n" +
      GROET,
  },

  // 21 — Follow-up na offerte
  {
    key: "followup_offerte",
    naam: "21 · Follow-up na offerte",
    onderwerp: "Nog vragen over onze offerte?",
    tekst:
      "Beste [naam],\n\n" +
      "Ik ben benieuwd of je onze offerte voor [bedrijf] al hebt kunnen bekijken. Roept 'ie nog vragen op, of wil je ergens over sparren?\n\n" +
      "Ik denk graag mee om 'm precies passend te maken — qua scope, fasering of budget. Laat gerust weten wat voor jullie het beste werkt.\n\n" +
      GROET,
  },

  // 22 — Tevredenheid / review na oplevering
  {
    key: "review",
    naam: "22 · Tevredenheid na oplevering",
    onderwerp: "Hoe bevalt het tot nu toe?",
    tekst:
      "Beste [naam],\n\n" +
      "Nu [oplevering/onderdeel] live staat bij [bedrijf], ben ik benieuwd hoe het bevalt. Loopt alles zoals je had gehoopt?\n\n" +
      "Mochten er nog puntjes zijn, dan pak ik die graag op. En ben je tevreden? Dan stellen we een korte review enorm op prijs — dat helpt ons om nog meer ondernemers te helpen.\n\n" +
      GROET,
  },
];
