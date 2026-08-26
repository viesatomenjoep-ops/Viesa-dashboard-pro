/**
 * Wat Viesa aanbiedt, als gegevens in plaats van als opmaak.
 *
 * Eén bron voor twee documenten die er heel verschillend uitzien: de
 * promotiemail (tabellen, inline CSS, veilige lettertypen — want Gmail en
 * Outlook slopen al het andere) en het voorstel in de rapport-huisstijl (echte
 * CSS, webfonts, afdrukbaar). Dezelfde teksten, twee keer opgemaakt.
 *
 * Zonder dit bestand zou een gewijzigde dienstomschrijving op twee plekken
 * bijgewerkt moeten worden, en dan lopen ze binnen een maand uit elkaar.
 *
 * De teksten komen letterlijk van de landingspagina (`Viesa Landing Page`),
 * zodat een prospect die eerst de mail leest en daarna de site opent hetzelfde
 * verhaal ziet. Dat is geen detail: verschillende beloftes op verschillende
 * plekken is precies wat vertrouwen kost.
 */

export type Dienst = {
  sleutel: string;
  /** Het bovenkopje op de kaart: "KLANTENSERVICE", "INTEGRATIES". */
  categorie: string;
  naam: string;
  /** Eén zin. Twee is er één te veel in een mail. */
  belofte: string;
  /** Wat het concreet oplevert — het bewijs onder de belofte. */
  opbrengst: string;
};

export const DIENSTEN: Dienst[] = [
  {
    sleutel: "calling",
    categorie: "Telefonie",
    naam: "AI Calling Agents",
    belofte:
      "Een AI-agent die de telefoon opneemt, de vraag begrijpt en er meteen iets mee doet.",
    opbrengst: "Geen gemiste oproep meer buiten kantooruren, en geen wachtrij tijdens de piek.",
  },
  {
    sleutel: "chat",
    categorie: "Klantenservice",
    naam: "AI Chatbots",
    belofte:
      "Een chatbot die uw systemen echt inkijkt — order, voorraad, retour — in plaats van door te verwijzen.",
    opbrengst: "Het merendeel van de standaardvragen wordt afgehandeld zonder tussenkomst.",
  },
  {
    sleutel: "workflow",
    categorie: "Integraties",
    naam: "Workflow-automatisering",
    belofte:
      "Shop, ERP, WMS en CRM praten met elkaar, zodat gegevens niet meer worden overgetypt.",
    opbrengst: "Uren handwerk per week verdwijnen, en met dat handwerk ook de typefouten.",
  },
  {
    sleutel: "mail",
    categorie: "E-mail",
    naam: "E-mailautomatisering",
    belofte:
      "Offertes, herinneringen en opvolging gaan er automatisch uit, in uw eigen toon.",
    opbrengst: "Niets blijft liggen omdat iemand het vergat — de opvolging loopt vanzelf door.",
  },
  {
    sleutel: "web",
    categorie: "Digitaal",
    naam: "Websites & Apps",
    belofte:
      "Sites en apps die scoren in Google én genoemd worden door ChatGPT, Claude en Gemini.",
    opbrengst: "Gevonden worden waar uw klanten tegenwoordig zoeken, niet alleen waar ze zochten.",
  },
  {
    sleutel: "dashboard",
    categorie: "Inzicht",
    naam: "KPI-dashboards & portalen",
    belofte:
      "Eén scherm met wat er vandaag gebeurt: orders, uren, marge, achterstand.",
    opbrengst: "Sturen op cijfers van vanochtend in plaats van op een rapport van vorige maand.",
  },
];

export type Pijler = { naam: string; uitleg: string };

/** Waarom bedrijven voor ons kiezen — de drie pijlers van de landingspagina. */
export const PIJLERS: Pijler[] = [
  {
    naam: "Alles werkt samen",
    uitleg:
      "Onze oplossingen sluiten aan op de systemen die u al gebruikt. Geen losse eilanden, maar één werkend geheel.",
  },
  {
    naam: "AI- en SEO-geoptimaliseerd",
    uitleg:
      "Websites en content die goed scoren in Google én zichtbaar zijn in AI-platforms zoals ChatGPT en Gemini.",
  },
  {
    naam: "Maatwerk met ROI-focus",
    uitleg:
      "Elke oplossing wordt gebouwd met een concreet doel: meetbaar minder handwerk en meer rendement.",
  },
];

/**
 * Eén review, letterlijk uit de landingspagina.
 *
 * Eén, niet vijf: een mail vol aanbevelingen leest als een reclamefolder. Eén
 * concrete zin van een echte klant doet meer dan een muur van sterren.
 */
export const REVIEW = {
  tekst:
    "Super tevreden over de samenwerking. Dankzij hun innovatieve aanpak en slimme automatiseringen draait onze webshop nu nóg optimaler.",
  bron: "Uit onze Google-reviews — alle beoordelingen staan op vijf sterren",
};

/** De belofte boven het aanbod, in één regel. */
export const KERNBELOFTE =
  "Wij maken werkprocessen slimmer en mobieler — met tien jaar softwarekennis en de kracht van AI.";

/** Wat de eerste stap is. Bewust gratis en bewust klein. */
export const AUDIT_BELOFTE =
  "Een gratis AI- en automatiseringsaudit: binnen enkele dagen weet u waar automatisering bij u het meeste oplevert, en wat het kost.";
