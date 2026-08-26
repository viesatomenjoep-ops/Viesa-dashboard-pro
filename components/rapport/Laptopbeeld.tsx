/**
 * De site van de klant in een laptop, bovenaan het rapport.
 *
 * Waarom dit het eerste is wat hij ziet: een rapport dat opent met een cijfer
 * gaat over ons oordeel. Een rapport dat opent met zijn eigen homepage gaat
 * over hem. Pas daaronder komt de uitslag — en dan kijkt hij al mee.
 *
 * Het beeld komt uit Lighthouse (`final-screenshot`, desktopvariant): een echte
 * Chrome bij Google die de pagina rendert. Geen mockup-generator, geen tweede
 * dienst, geen kosten. Ontbreekt hij, dan valt dit terug op de og:image; is ook
 * die er niet, dan tonen we een leeg scherm met alleen het adres — eerlijker
 * dan een voorraadplaatje van een site die de klant niet herkent.
 *
 * Alles is CSS, geen afbeelding van een laptop: dat blijft scherp op papier,
 * schaalt mee met de kolom, en kost geen enkele byte extra in de PDF.
 */
export function Laptopbeeld({
  afbeelding,
  host,
  /** Donker op de omslag, licht op een zandkleurige sectie. */
  toon = "donker",
}: {
  afbeelding: string | null;
  host: string;
  toon?: "donker" | "licht";
}) {
  return (
    <figure className={`lap lap-${toon}`}>
      <div className="lap-scherm">
        {/* De browserrand: drie stippen en het echte adres. Zonder die rand
            leest de schermafdruk als een losse foto in plaats van als "dit is
            uw site zoals een bezoeker hem opent". */}
        <div className="lap-balk">
          <span className="lap-stip" style={{ background: "#F0685F" }} aria-hidden="true" />
          <span className="lap-stip" style={{ background: "#F5BE4F" }} aria-hidden="true" />
          <span className="lap-stip" style={{ background: "#5FC97D" }} aria-hidden="true" />
          <span className="lap-adres">{host}</span>
        </div>

        <div className="lap-venster">
          {afbeelding ? (
            // eslint-disable-next-line @next/next/no-img-element -- data-URI uit Lighthouse; next/image kan daar niets mee
            <img src={afbeelding} alt={`De homepage van ${host}`} className="lap-foto" />
          ) : (
            <div className="lap-leeg">
              <span>Geen schermafdruk beschikbaar</span>
            </div>
          )}
        </div>
      </div>

      {/* De onderrand van de laptop: scharnier, voet, en het uitsparinkje. */}
      <div className="lap-voet" aria-hidden="true">
        <span className="lap-gleuf" />
      </div>
    </figure>
  );
}
