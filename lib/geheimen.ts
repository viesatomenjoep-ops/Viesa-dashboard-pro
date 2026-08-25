/**
 * Opschonen van sleutels die als HTTP-header meegaan.
 *
 * Een header-waarde mag alleen tekens 0–255 bevatten (een ByteString). Zit er
 * één teken in dat daarbuiten valt, dan gooit `fetch` een fout die niets zegt
 * over de échte oorzaak:
 *
 *   Cannot convert argument to a ByteString because the character at index 0
 *   has a value of 8592 which is greater than 255
 *
 * 8592 is `←`. Zulke tekens komen nooit in een echte sleutel voor — ze glippen
 * mee bij het kopiëren, bijvoorbeeld uit een dashboard dat de waarde afkapt of
 * gemaskeerd toont. Dit is dezelfde valkuil als de bullet (`•`) in de Supabase
 * anon-key uit de geleerde lessen in CLAUDE.md.
 *
 * Daarom halen we die tekens er hier weg in plaats van de app te laten
 * omvallen op een onbegrijpelijke melding.
 */

/** Onzichtbare tekens die bij plakken meekomen: zero-width, BOM, harde spatie. */
const ONZICHTBAAR = /[\u200B-\u200D\uFEFF\u00A0]/g;

/** Alles wat niet in een HTTP-header past: buiten het printbare ASCII-bereik. */
const NIET_HEADER_VEILIG = /[^\x20-\x7E]/g;

export type SleutelResultaat = {
  /** De opgeschoonde sleutel, klaar om als header mee te sturen. */
  sleutel: string;
  /**
   * De tekens die zijn weggehaald, als leesbare omschrijving. Leeg als de
   * sleutel al schoon was. Gebruik dit om te waarschuwen, niet om te falen.
   */
  verwijderd: string[];
};

/**
 * Maakt een sleutel header-veilig: spaties eromheen weg, onzichtbare tekens
 * weg, en alles buiten printbaar ASCII weg. Meldt terug wát er is weggehaald,
 * zodat de aanroeper dat kan loggen — stil opschonen verbergt een
 * configuratiefout die de gebruiker uiteindelijk zelf moet herstellen.
 */
export function schoonSleutel(waarde: string | undefined | null): SleutelResultaat {
  const ruw = (waarde ?? "").trim().replace(ONZICHTBAAR, "");
  const verwijderd: string[] = [];

  const sleutel = ruw.replace(NIET_HEADER_VEILIG, (teken) => {
    verwijderd.push(`${JSON.stringify(teken)} (code ${teken.codePointAt(0)})`);
    return "";
  });

  return { sleutel, verwijderd };
}

/**
 * Zoals `schoonSleutel`, maar geeft alleen de sleutel terug en schrijft een
 * waarschuwing naar de serverlog als er iets is weggehaald. Handig op plekken
 * waar falen geen optie is (Supabase-clients, middleware).
 */
export function schoneSleutel(waarde: string | undefined | null, naam: string): string {
  const { sleutel, verwijderd } = schoonSleutel(waarde);
  if (verwijderd.length > 0) {
    console.warn(
      `[geheimen] ${naam} bevatte ${verwijderd.length} ongeldig teken(s) die zijn genegeerd: ` +
        `${verwijderd.join(", ")}. Kopieer de waarde opnieuw uit het dashboard — ` +
        `gemaskeerd kopiëren levert zulke tekens op.`,
    );
  }
  return sleutel;
}
