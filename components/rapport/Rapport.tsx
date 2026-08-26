import type { Rapport as RapportData } from "@/lib/rapport/types";
import { merkKlassen } from "@/lib/rapport/fonts";
import { CONTACT_MAIL } from "@/lib/rapport/contact";
import { RapportOmslag } from "./RapportOmslag";
import { Tabbalk } from "./Tabbalk";
import { OnderdeelBlok } from "./OnderdeelBlok";
import { HerkomstBlok } from "./HerkomstBlok";
import { AfdrukKnop } from "./AfdrukKnop";
import { Merkregel } from "./Merkregel";
import "./rapport.css";

/**
 * Het volledige klantrapport — het sjabloon waar zowel het scherm als de PDF
 * uit komen. Er is geen tweede opmaak: de knop "Download als PDF" drukt precies
 * dit document af (zie @media print in rapport.css).
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

      {rapport.onderdelen.map((onderdeel) => (
        <OnderdeelBlok key={onderdeel.sleutel} onderdeel={onderdeel} />
      ))}

      <HerkomstBlok herkomst={rapport.herkomst} nietBeoordeeld={rapport.nietBeoordeeld} />

      <section id="afspraak" className="rap-op-donker" style={{ background: "var(--navy)", color: "var(--zand)" }}>
        <div className="rap-breed" style={{ padding: "58px 24px" }}>
          <div className="rap-stapel" style={{ gap: 18 }}>
            <h2 style={{ color: "var(--zand)" }}>Zullen we dit samen doornemen?</h2>
            <p className="rap-lees" style={{ color: "#B9C2D4" }}>
              Een half uur, en u weet wat er moet gebeuren en wat het kost. We lopen de punten
              hierboven langs op volgorde van wat het meeste oplevert.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <a className="rap-knop rap-knop-accent" href={`mailto:${CONTACT_MAIL}`}>
                Plan een strategiegesprek
                <span aria-hidden="true">→</span>
              </a>
              <span className="rap-alleen-scherm">
                <AfdrukKnop />
              </span>
            </div>
          </div>
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
