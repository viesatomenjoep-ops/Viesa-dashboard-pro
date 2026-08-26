import type { Rapport as RapportData, Prioriteit } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";
import { merkKlassen } from "@/lib/rapport/fonts";
import { CONTACT_MAIL } from "@/lib/rapport/contact";
import { Merkregel } from "./Merkregel";
import { Ringgrafiek } from "./Ringgrafiek";
import { Laptopbeeld } from "./Laptopbeeld";
import { Scorematrix } from "./Scorematrix";
import { Contactblok } from "./Contactblok";
import { AfdrukKnop } from "./AfdrukKnop";
import "./rapport.css";
import "./laptopbeeld.css";
import "./samenvatting.css";

/**
 * De korte versie van het rapport: alles op twee vellen, en zo min mogelijk
 * tekst.
 *
 * Het volledige rapport telt zeven onderdelen met alle metingen en het bewijs
 * eronder — dat is wat een ontwikkelaar wil zien, niet wat een directeur leest.
 * Deze versie doet het omgekeerde: eerst zijn eigen site in een laptop, dan het
 * cijfer, dan alle zeven balken naast elkaar, en pas daarna per onderdeel één
 * zin. Wie alleen kijkt en niet leest, weet na tien seconden genoeg.
 *
 * De kleur komt uit de meting en niet uit de prioriteit. Dat onderscheid is het
 * hele punt: prioriteit zegt hoe zwaar iets weegt in het gesprek, kleur zegt
 * hoe het ervoor staat. Door elkaar gehaald wordt een onderdeel rood zodra het
 * belangrijk is, en dan klopt er niets meer van het beeld.
 *
 * Ontworpen om af te drukken: de kaarten staan in een raster dat op A4 in twee
 * kolommen valt, met `break-inside: avoid` zodat er nooit een kaart over een
 * paginarand heen wordt gesneden.
 */

/** De prioriteit als vijf bolletjes, zoals in een verkoopgesprek. */
function Weging({ prioriteit }: { prioriteit: Prioriteit }) {
  const label = prioriteit >= 4 ? "Hoog" : prioriteit >= 3 ? "Gemiddeld" : "Laag";
  return (
    <span className="sam-weging" title={`Weegt ${label.toLowerCase()} in het gesprek`}>
      <span className="sam-bollen" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`sam-bol${n <= prioriteit ? " sam-bol-aan" : ""}`} />
        ))}
      </span>
      <span className="sam-weging-label">{label}</span>
    </span>
  );
}

export function Samenvatting({
  rapport,
  volledigUrl,
  voorstelUrl,
}: {
  rapport: RapportData;
  /** Waar het volledige rapport staat — null als dat er niet is. */
  volledigUrl?: string | null;
  /** Het voorstel: wat wij hieraan zouden doen, en wat we verder aanbieden. */
  voorstelUrl?: string | null;
}) {
  const { totaalScore, host, bedrijf, herkomst, onderdelen, samenvatting, schermafdruk } = rapport;
  const stand = standVanScore(totaalScore, 80);
  const gemeten = onderdelen.filter((o) => o.score !== null);
  const opGroen = gemeten.filter((o) => o.score !== null && o.score >= o.norm).length;
  const kansen = onderdelen.reduce((n, o) => n + o.bevindingen.filter((b) => !b.goed).length, 0);
  const alGoed = onderdelen.reduce((n, o) => n + o.bevindingen.filter((b) => b.goed).length, 0);

  const datum = new Date(herkomst.gemetenOp).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`rap sam ${merkKlassen}`}>
      <header className="rap-omslag sam-omslag">
        <div className="rap-breed">
          <div className="rap-merkregel">
            <Merkregel toon="donker" />
          </div>
          <span className="rap-merknaam">
            Samenvatting · {host} · {datum}
          </span>

          <div className="rap-omslag-raster">
            <div className="rap-stapel" style={{ gap: 24 }}>
              <h1>{bedrijf ?? host}</h1>

              <div className="rap-omslag-cijfer">
                <Ringgrafiek score={totaalScore} norm={80} maat={124} toonNorm={false} toonOordeel={false} />
                <div className="rap-stapel" style={{ gap: 6 }}>
                  <span className="rap-omslag-stand" style={{ color: `var(--${stand})` }}>
                    {totaalScore === null ? "Niet te bepalen" : STAND_LABEL[stand]}
                  </span>
                  <span className="rap-klein" style={{ color: "#8FA1BD" }}>
                    {opGroen} van {gemeten.length} onderdelen op de norm
                  </span>
                </div>
              </div>
            </div>

            <div className="rap-omslag-beeld">
              <Laptopbeeld afbeelding={schermafdruk} host={host} toon="donker" />
              <span className="rap-omslag-bijschrift">Uw site, zoals wij hem tijdens de scan zagen</span>
            </div>
          </div>

          {/* Twee getallen, geen vier: wat er goed staat en wat er te winnen
              valt. In een samenvatting is elk extra cijfer er één te veel. */}
          <div className="sam-saldo">
            <div className="sam-saldo-vak">
              <b style={{ color: "var(--goed)" }}>{alGoed}</b>
              <span>punten staan al goed</span>
            </div>
            <div className="sam-saldo-vak">
              <b style={{ color: kansen > 0 ? "var(--beter)" : "var(--goed)" }}>{kansen}</b>
              <span>kansen om te pakken</span>
            </div>
            <div className="sam-saldo-balk" aria-hidden="true">
              <span
                className="sam-saldo-goed"
                style={{ flex: Math.max(alGoed, 0.001) }}
              />
              <span
                className="sam-saldo-open"
                style={{ flex: Math.max(kansen, 0.001) }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="sam-matrix">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 8, marginBottom: 20 }}>
            <span className="rap-label rap-label-accent">Alles in één beeld</span>
            <h2>Waar staat u per onderdeel?</h2>
          </div>
          <Scorematrix onderdelen={onderdelen} />
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
              <span className="rap-legenda-norm" aria-hidden="true" />
              De norm voor dit onderdeel
            </span>
          </div>
        </div>
      </section>

      <section className="sam-blok">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 8, marginBottom: 22 }}>
            <span className="rap-label rap-label-accent">Op volgorde van opbrengst</span>
            <h2>Wat we zouden aanpakken, en in welke volgorde</h2>
          </div>

          <div className="sam-raster">
            {samenvatting.map((kaart, i) => {
              const kaartStand = standVanScore(kaart.score, kaart.norm);
              const totaalPunten = kaart.goed + kaart.teDoen;
              return (
                <article key={kaart.sleutel} className={`sam-kaart sam-${kaartStand}`}>
                  <div className="sam-kaart-kop">
                    <span className="sam-rang">{i + 1}</span>
                    <div className="sam-kaart-titel">
                      <span className="sam-vraag">{kaart.vraag}</span>
                      <h3 className="sam-titel">{kaart.kop}</h3>
                    </div>
                    <span className="sam-score" style={{ color: `var(--${kaartStand})` }}>
                      {kaart.score === null ? "—" : kaart.score}
                    </span>
                  </div>

                  {/* De verhouding goed/te doen als één strook. Twee getallen
                      naast elkaar zijn te vergelijken; een strook zie je. */}
                  {totaalPunten > 0 && (
                    <div className="sam-verdeling" aria-hidden="true">
                      <span className="sam-verdeling-goed" style={{ flex: Math.max(kaart.goed, 0.001) }} />
                      <span className="sam-verdeling-open" style={{ flex: Math.max(kaart.teDoen, 0.001) }} />
                    </div>
                  )}
                  {totaalPunten > 0 && (
                    <p className="sam-telling">
                      <b style={{ color: "var(--goed)" }}>{kaart.goed} goed</b>
                      <span className="sam-telling-scheiding" aria-hidden="true" />
                      <b style={{ color: kaart.teDoen > 0 ? "var(--nodig)" : "var(--zacht)" }}>
                        {kaart.teDoen} te doen
                      </b>
                    </p>
                  )}

                  <div className="sam-voet">
                    <p className="sam-slot">{kaart.slotzin}</p>
                    <Weging prioriteit={kaart.prioriteit} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sam-slotblok rap-op-donker">
        <div className="rap-breed">
          <Contactblok
            host={host}
            kop={volledigUrl ? "Dit was de korte versie" : "Zullen we dit samen doornemen?"}
            lees={
              volledigUrl
                ? "Een half uur, en u weet wat er moet gebeuren en wat het kost. Alle metingen met de norm en het bewijs eronder staan in het volledige rapport."
                : "Een half uur, en u weet wat er moet gebeuren en wat het kost. We lopen de punten hierboven langs op volgorde van wat het meeste oplevert."
            }
            eerste={
              volledigUrl
                ? { label: "Naar het volledige rapport", href: volledigUrl }
                : voorstelUrl
                  ? { label: "Wat wij verder aanbieden", href: voorstelUrl }
                  : null
            }
          />
          <span className="rap-alleen-scherm" style={{ display: "inline-block", marginTop: 18 }}>
            <AfdrukKnop label="Samenvatting als PDF" />
          </span>
        </div>
      </section>

      <footer className="sam-voetregel">
        <div
          className="rap-breed"
          style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}
        >
          <Merkregel toon="donker" hoogte={26} />
          <span className="rap-klein" style={{ color: "#8FA1BD" }}>
            {host} · {CONTACT_MAIL}
          </span>
        </div>
      </footer>
    </div>
  );
}
