import type { Onderdeel } from "@/lib/rapport/types";
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
 */
export function OnderdeelBlok({ onderdeel }: { onderdeel: Onderdeel }) {
  const {
    nummer, naam, oordeelKop, methode, score, norm,
    metingen, vaststellingen, bevindingen, technologie, oordeel, acties,
  } = onderdeel;

  const gemist = bevindingen.filter((b) => !b.goed);
  const gehaald = bevindingen.filter((b) => b.goed);

  return (
    <section className="rap-onderdeel" id={`onderdeel-${onderdeel.sleutel}`}>
      <div className="rap-breed">
        <div className="rap-stapel" style={{ gap: 34 }}>
          {/* Kop met de score ernaast */}
          <div className="rap-onderdeel-kop">
            <div className="rap-stapel rap-lees" style={{ gap: 13, flex: "1 1 380px" }}>
              <span className="rap-label rap-label-accent">
                Onderdeel {nummer} · {naam}
              </span>
              <h2>{oordeelKop}</h2>
              <p className="rap-klein">{methode}</p>
            </div>
            <Ringgrafiek score={score} norm={norm} />
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
            <div className="rap-stapel" style={{ gap: 11 }}>
              <h3>Wat we vonden</h3>
              <BevindingenLijst bevindingen={gemist} />
            </div>
          )}

          {gehaald.length > 0 && (
            <div className="rap-stapel" style={{ gap: 11 }}>
              <h3>Wat al goed staat</h3>
              <BevindingenLijst bevindingen={gehaald} />
            </div>
          )}

          <div className="rap-oordeel">
            <span className="rap-label">Ons oordeel</span>
            <p className="rap-lees">{oordeel}</p>
          </div>

          {acties.length > 0 && (
            <div className="rap-stapel" style={{ gap: 17 }}>
              <h3>Wat we hier zouden doen</h3>
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
