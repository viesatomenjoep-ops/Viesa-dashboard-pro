import type { Onderdeel } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";
import { Ringgrafiek } from "./Ringgrafiek";
import { Meetbalk } from "./Meetbalk";
import { BevindingenLijst, VaststellingRegel } from "./Bevindingen";

/**
 * Eén onderdeel van het rapport, in de volgorde die het bouwplan voorschrijft:
 *
 *   bovenkopje → oordeelkop → methode → score met norm → metingen →
 *   vaststellingen → bevindingen → technologie → ons oordeel → wat te doen
 *
 * De methode staat bewust vóór het cijfer (regel 2): een klant die begrijpt wat
 * er gemeten is, vertrouwt de uitkomst. En het blok eindigt nooit bij een
 * constatering (regel 5) — onderaan staat altijd wat er moet gebeuren.
 *
 * De kleur van het onderdeel komt uit zijn eigen stand: een gekleurde band
 * boven het blok en een gekleurd streepje langs de kop. Zo weet je bij het
 * doorbladeren van een geprint rapport meteen waar je bent, zonder één cijfer te
 * hoeven lezen. De methode staat in een eigen, kleiner kader — het is
 * verantwoording, geen leestekst, en hoort niet net zo zwaar te wegen als het
 * oordeel eronder.
 */
export function OnderdeelBlok({ onderdeel }: { onderdeel: Onderdeel }) {
  const {
    nummer, naam, oordeelKop, methode, score, norm,
    metingen, vaststellingen, bevindingen, technologie, oordeel, acties,
  } = onderdeel;

  const stand = standVanScore(score, norm);
  const gemist = bevindingen.filter((b) => !b.goed);
  const gehaald = bevindingen.filter((b) => b.goed);

  return (
    <section className={`rap-onderdeel rap-ond-${stand}`} id={`onderdeel-${onderdeel.sleutel}`}>
      {/* De gekleurde band: de stand van dit onderdeel, over de volle breedte. */}
      <span className="rap-ond-band" style={{ background: `var(--${stand})` }} aria-hidden="true" />

      <div className="rap-breed">
        <div className="rap-stapel" style={{ gap: 30 }}>
          {/* Kop met de score ernaast */}
          <div className="rap-onderdeel-kop">
            <div className="rap-stapel rap-lees" style={{ gap: 12, flex: "1 1 380px" }}>
              <span className="rap-ond-nr">
                <b>{String(nummer).padStart(2, "0")}</b>
                <span className="rap-label">{naam}</span>
                <span
                  className="rap-ond-stand"
                  style={{ background: `var(--${stand}-vlak)`, color: `var(--${stand})` }}
                >
                  {score === null ? "Niet gemeten" : STAND_LABEL[stand]}
                </span>
              </span>
              <h2>{oordeelKop}</h2>
            </div>
            <Ringgrafiek score={score} norm={norm} />
          </div>

          <div className="rap-methode">
            <span className="rap-label">Hoe we dit gemeten hebben</span>
            <p>{methode}</p>
          </div>

          {metingen.length > 0 && (
            <div className="rap-stapel" style={{ gap: 40 }}>
              {metingen.map((m) => (
                <Meetbalk key={m.titel} meting={m} />
              ))}
            </div>
          )}

          {vaststellingen.length > 0 && (
            <div className="rap-stapel" style={{ gap: 26 }}>
              {vaststellingen.map((v) => (
                <VaststellingRegel key={v.titel} vaststelling={v} />
              ))}
            </div>
          )}

          {technologie && technologie.length > 0 && (
            <div className="rap-kaart rap-stapel" style={{ gap: 22 }}>
              {technologie.map((groep) => (
                <div key={groep.groep} className="rap-tech-groep">
                  <span className="rap-label">{groep.groep}</span>
                  <div className="rap-tech-pillen">
                    {groep.namen.map((naam) => (
                      <span key={naam} className="rap-pil">
                        {naam}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {gemist.length > 0 && (
            <div className="rap-stapel" style={{ gap: 13 }}>
              <h3 className="rap-groepkop">
                <span className="rap-groepstip" style={{ background: "var(--nodig)" }} aria-hidden="true" />
                Hier valt te winnen
                <span className="rap-groeptal" style={{ background: "var(--nodig-vlak)", color: "var(--nodig)" }}>
                  {gemist.length}
                </span>
              </h3>
              <BevindingenLijst bevindingen={gemist} />
            </div>
          )}

          {gehaald.length > 0 && (
            <div className="rap-stapel" style={{ gap: 13 }}>
              <h3 className="rap-groepkop">
                <span className="rap-groepstip" style={{ background: "var(--goed)" }} aria-hidden="true" />
                Dit staat al goed
                <span className="rap-groeptal" style={{ background: "var(--goed-vlak)", color: "var(--goed)" }}>
                  {gehaald.length}
                </span>
              </h3>
              <BevindingenLijst bevindingen={gehaald} />
            </div>
          )}

          <div className="rap-oordeel" style={{ borderLeftColor: `var(--${stand})` }}>
            <span className="rap-label" style={{ color: `var(--${stand})` }}>
              Ons oordeel
            </span>
            <p className="rap-lees">{oordeel}</p>
          </div>

          {acties.length > 0 && (
            <div className="rap-stapel" style={{ gap: 15 }}>
              <h3 className="rap-groepkop">
                <span className="rap-groepstip" style={{ background: "var(--accent)" }} aria-hidden="true" />
                Wat we hier zouden doen
              </h3>
              <ol className="rap-acties">
                {acties.map((actie, i) => (
                  <li key={i} className="rap-actie">
                    <span className="rap-actie-nr" aria-hidden="true" />
                    <span className="rap-lees">{actie}</span>
                  </li>
                ))}
              </ol>
              <a className="rap-knop rap-alleen-scherm" href="#afspraak">
                We plannen dit in
                <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
