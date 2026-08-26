/**
 * Het contract van het klantrapport.
 *
 * Deze typen zijn met opzet zo gebouwd dat de vijf regels uit het bouwplan niet
 * te omzeilen zijn:
 *
 *   1. elk cijfer heeft een norm      → `Onderdeel.norm`, `Meetschaal.zones`
 *   2. eerst de methode, dan de score → `Onderdeel.methode` is verplicht
 *   3. de meting is herhaalbaar       → `Herkomst`
 *   4. wat we niet weten, zeggen we   → `score: null` en `Rapport.nietBeoordeeld`
 *   5. elk onderdeel eindigt in actie  → `Onderdeel.acties`
 *
 * Een onderdeel toevoegen zonder methode of norm levert dus een typefout op,
 * en niet een rapport dat er stilletjes slechter uitziet.
 */

/** Hoe een waarde ervoor staat. `geen` = niet te beoordelen, telt nergens mee. */
export type Stand = "goed" | "beter" | "nodig" | "geen";

/** Zwaarte van een losse bevinding, zoals de chip die ervoor staat. */
export type Ernst = "ernstig" | "gemiddeld" | "licht" | "info";

/** Hoe zwaar een onderwerp weegt in het verkoopgesprek (1–5 bolletjes). */
export type Prioriteit = 1 | 2 | 3 | 4 | 5;

/**
 * Eén zone op een meetbalk. Zones lopen altijd op in waarde; de `stand` zegt
 * of die zone goed of slecht is. Zo werkt dezelfde balk voor "lager is beter"
 * (laadtijd) en "hoger is beter" (een score) zonder extra vlag.
 */
export type Zone = {
  /** Bovengrens van deze zone. De laatste zone bepaalt het maximum van de as. */
  tot: number;
  stand: Stand;
  /** Wat er boven de zone staat: "snel", "kan beter", "traag". */
  label: string;
};

export type Meetschaal = {
  zones: Zone[];
  /** Ondergrens van de as. Standaard 0. */
  vanaf?: number;
};

/** Eén gemeten waarde met zijn schaal — de meetbalk uit het rapport. */
export type Meting = {
  titel: string;
  /** Wat er gemeten is, in gewone taal. Staat bóven de balk. */
  uitleg: string;
  /** `null` = niet gemeten; de balk toont dan geen markering. */
  waarde: number | null;
  /** Hoe de waarde getoond wordt: "2,2 s", "0,039", "16 elementen". */
  weergave: string | null;
  schaal: Meetschaal;
  /** De zin onder de balk die de waarde duidt. */
  duiding: string;
};

/** Een losse bevinding: wat er is, waarom het uitmaakt, en wat eraan te doen. */
export type Bevinding = {
  titel: string;
  uitleg: string;
  /** Alleen invullen als er iets te doen is. */
  advies?: string;
  ernst: Ernst;
  goed: boolean;
  /** Bijvoorbeeld "9 elementen" — komt vóór de titel te staan. */
  aantal?: string;
};

/** Een enkele ja/nee-uitkomst, als groen of rood balkje met een oordeel ernaast. */
export type Vaststelling = {
  titel: string;
  uitleg: string;
  antwoord: string;
  stand: Stand;
};

/** Herkende technologie, gegroepeerd zoals in het techniek-onderdeel. */
export type TechGroep = { groep: string; namen: string[] };

export type Onderdeel = {
  sleutel: string;
  nummer: number;
  /** "Vindbaarheid" — ook het label in de tabbalk. */
  naam: string;
  /** De kop: "Google vindt je producten en leest de details". */
  oordeelKop: string;
  /** Regel 2: wat we deden, vóór het cijfer. Verplicht. */
  methode: string;
  /** `null` = niet gemeten. Toont een streepje, geen nul. */
  score: number | null;
  /** Regel 1: de drempel die naast elk cijfer staat. */
  norm: number;
  /** De "ONS OORDEEL"-tekst onderaan het onderdeel. */
  oordeel: string;
  /** Hoe zwaar dit weegt — bepaalt de bolletjes op de samenvattingskaart. */
  prioriteit: Prioriteit;
  metingen: Meting[];
  bevindingen: Bevinding[];
  vaststellingen: Vaststelling[];
  technologie?: TechGroep[];
  /** Regel 5: geen onderdeel eindigt zonder handeling. */
  acties: string[];
};

/** Regel 3: waar de cijfers vandaan komen, en hoe je ze herhaalt. */
export type Herkomst = {
  paginas: number;
  controles: number;
  rekentijdSeconden: number;
  /** ISO-datum van het moment van meten. */
  gemetenOp: string;
  instrumenten: { naam: string; versie: string }[];
  scoremodel: string;
};

/** Eén kaart in de doorbladerbare samenvatting. */
export type SamenvattingKaart = {
  /** Het onderdeel waar deze kaart bij hoort — voor de ankerlink en de sleutel. */
  sleutel: string;
  naam: string;
  /** De vraag erboven: "Hoe goed is de technische basis?" */
  vraag: string;
  kop: string;
  verhaal: string;
  waaromBelangrijk: string;
  slotzin: string;
  prioriteit: Prioriteit;
  /**
   * De score en de norm van het onderdeel, zodat de kaart zijn kleur uit de
   * meting haalt en niet uit de prioriteit. Prioriteit zegt hoe zwaar iets
   * weegt in het gesprek; kleur hoort te zeggen hoe het ervoor staat. Dat zijn
   * twee verschillende dingen, en ze door elkaar halen maakt een goed
   * onderdeel rood zodra het belangrijk is.
   */
  score: number | null;
  norm: number;
  /** Hoeveel er goed staat en hoeveel er te doen is — de balk op de kaart. */
  goed: number;
  teDoen: number;
};

export type Rapport = {
  bedrijf: string | null;
  host: string;
  url: string;
  /** `null` als er te weinig gemeten kon worden voor een totaaloordeel. */
  totaalScore: number | null;
  /**
   * Een echte schermafdruk van de homepage op laptopformaat. Staat bovenaan
   * beide rapporten in een laptopbeeld: de klant ziet zijn eigen site als
   * eerste, en pas daarna het cijfer erover.
   */
  schermafdruk: string | null;
  /** De og:image — de terugval, en wat een gedeelde link laat zien. */
  ogAfbeelding: string | null;
  onderdelen: Onderdeel[];
  samenvatting: SamenvattingKaart[];
  herkomst: Herkomst;
  /** Regel 4: punten die we niet automatisch konden beoordelen. */
  nietBeoordeeld: string[];
};
