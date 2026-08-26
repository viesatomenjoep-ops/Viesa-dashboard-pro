import type { Rapport as RapportData } from "@/lib/rapport/types";
import { merkKlassen } from "@/lib/rapport/fonts";
import { CONTACT_MAIL } from "@/lib/rapport/contact";
import { RapportOmslag } from "./RapportOmslag";
import { Tabbalk } from "./Tabbalk";
import { Scorematrix } from "./Scorematrix";
import { OnderdeelBlok } from "./OnderdeelBlok";
import { HerkomstBlok } from "./HerkomstBlok";
import { AfdrukKnop } from "./AfdrukKnop";
import { Contactblok } from "./Contactblok";
import { Merkregel } from "./Merkregel";
import "./rapport.css";
import "./laptopbeeld.css";

/**
 * Het volledige klantrapport — het sjabloon waar zowel het scherm als de PDF
 * uit komen. Er is geen tweede opmaak: de knop "Download als PDF" drukt precies
 * dit document af (zie @media print in rapport.css).
 *
 * De volgorde is die van een gesprek. Eerst zijn eigen site en het totaalcijfer
 * (de omslag), dan alle zeven onderdelen náást elkaar in één beeld (de
 * scorematrix) zodat hij zelf kan aanwijzen waar het schuurt, en pas daarna de
 * onderdelen één voor één met het bewijs eronder. Wie alleen de eerste twee
 * bladen leest, weet genoeg om een afspraak te maken; wie doorleest, krijgt de
 * verantwoording.
 *
 * Alles is een server-component: het rapport is een leesdocument zonder staat,
 * en dan hoort er geen JavaScript naar de browser te gaan. Alleen de afdrukknop
 * is een client-component, want die roept window.print() aan.
 */
export function Rapport({
  rapport,
  korteUrl,
}: {
  rapport: RapportData;
  /** De korte versie, als die er is — bovenaan als tweede ingang. */
  korteUrl?: string | null;
}) {
  return (
    <div className={`rap ${merkKlassen}`}>
      <RapportOmslag rapport={rapport} korteUrl={korteUrl} />
      <Tabbalk onderdelen={rapport.onderdelen} />

      <section className="rap-matrixblok">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 10, marginBottom: 26 }}>
            <span className="rap-label rap-label-accent">Alles in één beeld</span>
            <h2>Zeven onderdelen, elk met zijn eigen norm</h2>
          </div>

          <Scorematrix onderdelen={rapport.onderdelen} />

          <div className="rap-legenda">
            <span className="rap-legenda-item">
              <span className="rap-stip" style={{ background: "var(--goed)" }} aria-hidden="true" />
              Op de norm
            </span>
            <span className="rap-legenda-item">
              <span className="rap-stip" style={{ background: "var(--beter)" }} aria-hidden="true" />
              Kan beter
            </span>
            <span className="rap-legenda-item">
              <span className="rap-stip" style={{ background: "var(--nodig)" }} aria-hidden="true" />
              Aandacht nodig
            </span>
            <span className="rap-legenda-item">
              <span className="rap-legenda-arcering" aria-hidden="true" />
              Niet gemeten — telt niet mee
            </span>
            <span className="rap-legenda-item">
              <span className="rap-legenda-norm" aria-hidden="true" />
              De norm voor dit onderdeel
            </span>
          </div>
        </div>
      </section>

      {rapport.onderdelen.map((onderdeel) => (
        <OnderdeelBlok key={onderdeel.sleutel} onderdeel={onderdeel} />
      ))}

      <HerkomstBlok herkomst={rapport.herkomst} nietBeoordeeld={rapport.nietBeoordeeld} />

      <section id="afspraak" className="rap-op-donker" style={{ background: "var(--navy)", color: "var(--zand)" }}>
        <div className="rap-breed" style={{ padding: "58px 24px" }}>
          <Contactblok
            host={rapport.host}
            kop="Zullen we dit samen doornemen?"
            lees="Een half uur, en u weet wat er moet gebeuren en wat het kost. We lopen de punten hierboven langs op volgorde van wat het meeste oplevert."
          />
          <span className="rap-alleen-scherm" style={{ display: "inline-block", marginTop: 18 }}>
            <AfdrukKnop />
          </span>
        </div>
      </section>

      <footer style={{ background: "var(--diepnavy)", color: "#8FA1BD", padding: "34px 0" }}>
        <div
          className="rap-breed"
          style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}
        >
          <Merkregel toon="donker" hoogte={28} />
          <span className="rap-klein" style={{ color: "#8FA1BD" }}>
            {rapport.host} · {CONTACT_MAIL}
          </span>
        </div>
      </footer>
    </div>
  );
}
