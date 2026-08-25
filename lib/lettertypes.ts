/**
 * Lettertypes voor uitgaande e-mail en de editors.
 *
 * Dit is de énige plek waar lettertypes staan; de kiezer in de editor, het
 * voorbeeld en de verzonden HTML lezen allemaal uit deze lijst.
 *
 * Twee groepen, en dat onderscheid is belangrijk:
 *
 * - `veilig`  — stacks die op vrijwel elk apparaat aanwezig zijn. Gmail,
 *               Outlook.com en Apple Mail tonen deze altijd zoals bedoeld.
 * - `webfont` — mooiere letters die als webfont geladen moeten worden. In het
 *               dashboard-voorbeeld zie je ze écht (we laden ze dan van Google
 *               Fonts), maar in e-mail strippen de meeste clients webfonts.
 *               Daarom staat achter elk webfont een veilige terugval in de
 *               stack: de ontvanger ziet dan die terugval in plaats van iets
 *               willekeurigs.
 *
 * We sturen bewust géén @font-face of <link> mee in de e-mail zelf: dat wordt
 * door `saniteerHtml()` verwijderd en werkt in Gmail toch niet.
 */

export type LettertypeGroep = "veilig" | "webfont";

export type Lettertype = {
  /** Stabiele sleutel; wordt opgeslagen bij het sjabloon en in het formulier. */
  sleutel: string;
  label: string;
  /** Volledige CSS font-family-stack, inclusief terugval. */
  stack: string;
  groep: LettertypeGroep;
  /**
   * Naam van de Google-Fonts-familie voor het voorbeeld in het dashboard.
   * Alleen gevuld bij `groep: "webfont"`.
   */
  googleFont?: string;
};

/**
 * Zakelijke standaard: Times New Roman — de klassieke zakenbriefletter, en hij
 * staat op élk apparaat. Georgia blijft als alternatief beschikbaar (iets
 * ruimer van vorm, prettiger op scherm).
 */
export const STANDAARD_LETTERTYPE = "times";

export const LETTERTYPES: Lettertype[] = [
  // ---- Groep A: werkt overal ------------------------------------------------
  {
    sleutel: "georgia",
    label: "Georgia",
    stack: "Georgia, 'Times New Roman', Times, serif",
    groep: "veilig",
  },
  {
    sleutel: "arial",
    label: "Arial",
    stack: "Arial, Helvetica, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "helvetica",
    label: "Helvetica Neue",
    stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "verdana",
    label: "Verdana",
    stack: "Verdana, Geneva, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "tahoma",
    label: "Tahoma",
    stack: "Tahoma, Verdana, Geneva, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "trebuchet",
    label: "Trebuchet MS",
    stack: "'Trebuchet MS', Tahoma, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "segoe",
    label: "Segoe UI",
    stack: "'Segoe UI', Tahoma, Geneva, sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "calibri",
    label: "Calibri",
    stack: "Calibri, Candara, 'Segoe UI', sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "candara",
    label: "Candara",
    stack: "Candara, Calibri, 'Segoe UI', sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "lucida",
    label: "Lucida Sans",
    stack: "'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', sans-serif",
    groep: "veilig",
  },
  {
    sleutel: "times",
    label: "Times New Roman",
    stack: "'Times New Roman', Times, serif",
    groep: "veilig",
  },
  {
    sleutel: "cambria",
    label: "Cambria",
    stack: "Cambria, Georgia, serif",
    groep: "veilig",
  },
  {
    sleutel: "garamond",
    label: "Garamond",
    stack: "Garamond, 'Palatino Linotype', 'Book Antiqua', serif",
    groep: "veilig",
  },
  {
    sleutel: "palatino",
    label: "Palatino",
    stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    groep: "veilig",
  },
  {
    sleutel: "bookantiqua",
    label: "Book Antiqua",
    stack: "'Book Antiqua', Palatino, 'Palatino Linotype', serif",
    groep: "veilig",
  },
  {
    sleutel: "courier",
    label: "Courier New",
    stack: "'Courier New', Courier, monospace",
    groep: "veilig",
  },

  // ---- Groep B: webfont, met veilige terugval --------------------------------
  {
    sleutel: "inter",
    label: "Inter",
    stack: "Inter, 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Inter",
  },
  {
    sleutel: "poppins",
    label: "Poppins",
    stack: "Poppins, 'Trebuchet MS', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Poppins",
  },
  {
    sleutel: "source-sans",
    label: "Source Sans 3",
    stack: "'Source Sans 3', 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Source Sans 3",
  },
  {
    sleutel: "source-serif",
    label: "Source Serif 4",
    stack: "'Source Serif 4', Georgia, serif",
    groep: "webfont",
    googleFont: "Source Serif 4",
  },
  {
    sleutel: "roboto",
    label: "Roboto",
    stack: "Roboto, Arial, Helvetica, sans-serif",
    groep: "webfont",
    googleFont: "Roboto",
  },
  {
    sleutel: "open-sans",
    label: "Open Sans",
    stack: "'Open Sans', 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Open Sans",
  },
  {
    sleutel: "lato",
    label: "Lato",
    stack: "Lato, 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Lato",
  },
  {
    sleutel: "work-sans",
    label: "Work Sans",
    stack: "'Work Sans', 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "Work Sans",
  },
  {
    sleutel: "plex-sans",
    label: "IBM Plex Sans",
    stack: "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif",
    groep: "webfont",
    googleFont: "IBM Plex Sans",
  },
  {
    sleutel: "plex-serif",
    label: "IBM Plex Serif",
    stack: "'IBM Plex Serif', Georgia, serif",
    groep: "webfont",
    googleFont: "IBM Plex Serif",
  },
  {
    sleutel: "merriweather",
    label: "Merriweather",
    stack: "Merriweather, Georgia, serif",
    groep: "webfont",
    googleFont: "Merriweather",
  },
  {
    sleutel: "baskerville",
    label: "Libre Baskerville",
    stack: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
    groep: "webfont",
    googleFont: "Libre Baskerville",
  },
];

export const LETTERTYPE_GROEPEN: { key: LettertypeGroep; label: string }[] = [
  { key: "veilig", label: "Werkt in elke mailclient" },
  { key: "webfont", label: "Webfont — met veilige terugval" },
];

export function lettertypeVan(sleutel: string | null | undefined): Lettertype {
  return (
    LETTERTYPES.find((l) => l.sleutel === sleutel) ??
    LETTERTYPES.find((l) => l.sleutel === STANDAARD_LETTERTYPE)!
  );
}

/** De CSS-stack voor een sleutel; valt terug op de standaard bij onzin-invoer. */
export function lettertypeStack(sleutel: string | null | undefined): string {
  return lettertypeVan(sleutel).stack;
}

/**
 * Google-Fonts-URL om één webfont te laden voor het voorbeeld in het dashboard.
 * Geeft null voor de veilige groep — die hoeft niets te laden.
 */
export function googleFontUrl(sleutel: string | null | undefined): string | null {
  const l = lettertypeVan(sleutel);
  if (!l.googleFont) return null;
  const familie = l.googleFont.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${familie}:wght@400;600;700&display=swap`;
}
