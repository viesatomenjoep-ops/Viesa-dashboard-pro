/** Herbruikbare e-mailsjablonen voor het dashboard. Onderwerp + platte tekst;
 *  de tekst wordt bij verzenden in de huisstijl-HTML gewikkeld. */

export type MailTemplate = {
  key: string;
  naam: string;
  onderwerp: string;
  tekst: string;
};

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    key: "leeg",
    naam: "Leeg bericht",
    onderwerp: "",
    tekst: "",
  },
  {
    key: "offerte",
    naam: "Offerte nasturen",
    onderwerp: "Jullie offerte van Viesa Automations",
    tekst:
      "Beste [naam],\n\nBedankt voor het prettige gesprek. Zoals besproken stuur ik je hierbij onze offerte.\n\nHeb je vragen of wil je iets aanpassen? Laat het gerust weten, dan denk ik graag mee.\n\nMet vriendelijke groet,\nTom & Joep\nViesa Automations",
  },
  {
    key: "opvolging",
    naam: "Offerte opvolgen",
    onderwerp: "Even opvolgen — onze offerte",
    tekst:
      "Beste [naam],\n\nEnige tijd geleden stuurde ik je onze offerte. Ik ben benieuwd of je er al naar hebt kunnen kijken.\n\nMocht je nog vragen hebben of ergens over willen sparren, dan hoor ik het graag.\n\nMet vriendelijke groet,\nTom & Joep\nViesa Automations",
  },
  {
    key: "factuurherinnering",
    naam: "Factuurherinnering",
    onderwerp: "Vriendelijke herinnering — openstaande factuur",
    tekst:
      "Beste [naam],\n\nUit onze administratie blijkt dat de factuur met nummer [nummer] nog openstaat. Mogelijk is dit aan je aandacht ontsnapt.\n\nWil je de betaling alsnog in orde maken? Is de factuur al voldaan, dan kun je dit bericht als niet verzonden beschouwen.\n\nMet vriendelijke groet,\nViesa Automations",
  },
  {
    key: "afspraak",
    naam: "Afspraak bevestigen",
    onderwerp: "Bevestiging van onze afspraak",
    tekst:
      "Beste [naam],\n\nHierbij bevestig ik onze afspraak op [datum] om [tijd].\n\nMocht het onverhoopt niet uitkomen, laat het dan tijdig weten, dan plannen we een nieuw moment.\n\nTot dan!\n\nMet vriendelijke groet,\nViesa Automations",
  },
  {
    key: "reactie",
    naam: "Reactie op aanvraag",
    onderwerp: "Bedankt voor je aanvraag",
    tekst:
      "Beste [naam],\n\nBedankt voor je bericht en je interesse in Viesa Automations. Leuk dat je contact opneemt!\n\nIk kijk graag met je mee. Zou je kort kunnen toelichten wat je precies zoekt, dan kom ik snel bij je terug met een voorstel.\n\nMet vriendelijke groet,\nTom & Joep\nViesa Automations",
  },
];
