import type { Rapport as RapportData, Prioriteit } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";
import { merkKlassen } from "@/lib/rapport/fonts";
import { CONTACT_MAIL } from "@/lib/rapport/contact";
import { Merkregel } from "./Merkregel";
import { Ringgrafiek } from "./Ringgrafiek";
import { AfdrukKnop } from "./AfdrukKnop";
import "./rapport.css";
import "./samenvatting.css";

/**
 * De korte versie van het rapport: één kaart per onderdeel, zwaarste eerst.
 *
 * Bestaat omdat het volledige rapport zeven onderdelen met alle metingen en het
 * bewijs eronder telt — dat is wat een ontwikkelaar wil zien, niet wat een
 * directeur leest. Deze versie beantwoordt per onderdeel drie vragen: wat is er
 * aan de hand, waarom maakt dat uit, en hoe zwaar weegt het.
 *
 * Ontworpen om af te drukken: de kaarten staan in een raster dat op A4 in twee
 * kolommen valt, met `break-inside: avoid` zodat er nooit een kaart over een
 * paginarand heen wordt gesneden. Zo past de hele samenvatting op één of twee
 * vellen, en is de PDF hetzelfde document als het scherm.
 */

/** De prioriteit als vijf bolletjes, zoals in een verkoopgesprek. */
function Weging({ prioriteit }: { prioriteit: Prioriteit }) {
  const label =
    prioriteit >= 5 ? "Hoog" : prioriteit >= 4 ? "Hoog" : prioriteit >= 3 ? "Gemiddeld" : "Laag";
  return (
    <span className="sam-weging">
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
}: {
  rapport: RapportData;
  /** Waar het volledige rapport staat — null als dat er niet is. */
  volledigUrl?: string | null;
}) {
  const { totaalScore, host, bedrijf, herkomst, onderdelen, samenvatting } = rapport;
  const stand = standVanScore(totaalScore, 80);
  const gemeten = onderdelen.filter((o) => o.score !== null);
  const opGroen = gemeten.filter((o) => o.score !== null && o.score >= o.norm).length;
  const kansen = onderdelen.reduce((n, o) => n + o.bevindingen.filter((b) => !b.goed).length, 0);
  const snel = samenvatting.filter((k) => k.prioriteit <= 3).length;

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

          <div className="sam-kop">
            <Ringgrafiek score={totaalScore} norm={80} maat={124} toonNorm={false} />
            <div className="rap-stapel" style={{ gap: 12, flex: "1 1 320px" }}>
              <h1>{bedrijf ?? host}</h1>
              <p style={{ color: "#B9C2D4", fontSize: "1.05rem", maxWidth: "46ch" }}>
                {totaalScore === null ? (
                  "Er kon te weinig gemeten worden voor één totaaloordeel."
                ) : (
                  <>
                    <b style={{ color: `var(--${stand})` }}>{STAND_LABEL[stand]}</b> · {totaalScore}{" "}
                    van 100
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="rap-tegels">
            <div className="rap-tegel">
              <b>{kansen}</b>
              <span>kansen gevonden</span>
            </div>
            <div className="rap-tegel">
              <b>{snel}</b>
              <span>snel te regelen</span>
            </div>
            <div className="rap-tegel">
              <b>{opGroen}</b>
              <span>al op de norm</span>
            </div>
            <div className="rap-tegel">
              <b>{herkomst.paginas}</b>
              <span>pagina&apos;s bekeken</span>
            </div>
          </div>
        </div>
      </header>

      <section className="sam-blok">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 10, marginBottom: 26 }}>
            <span className="rap-label rap-label-accent">Per onderdeel</span>
            <h2>Dit kwam eruit, op volgorde van wat het meeste oplevert</h2>
          </div>

          <div className="sam-raster">
            {samenvatting.map((kaart, i) => (
              <article key={`${kaart.vraag}-${i}`} className="sam-kaart">
                <p className="sam-vraag">{kaart.vraag}</p>
                <h3 className="sam-titel">{kaart.kop}</h3>
                <p className="sam-verhaal">{kaart.verhaal}</p>

                <p className="sam-waarom-label">Waarom dit belangrijk is</p>
                <p className="sam-waarom">{kaart.waaromBelangrijk}</p>

                <div className="sam-voet">
                  <p className="sam-slot">{kaart.slotzin}</p>
                  <Weging prioriteit={kaart.prioriteit} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sam-slotblok rap-op-donker">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 16 }}>
            <h2 style={{ color: "var(--zand)" }}>
              {volledigUrl ? "Dit was de samenvatting. Wilt u het volledige rapport?" : "Zullen we dit samen doornemen?"}
            </h2>
            <p className="rap-lees" style={{ color: "#B9C2D4" }}>
              {volledigUrl
                ? "Alle metingen per onderdeel, met de norm en het bewijs eronder. U gaat direct door — geen formulier."
                : "Een half uur, en u weet wat er moet gebeuren en wat het kost. We lopen de punten hierboven langs op volgorde van wat het meeste oplevert."}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              {volledigUrl && (
                <a className="rap-knop rap-knop-accent" href={volledigUrl}>
                  Naar het volledige rapport
                  <span aria-hidden="true">→</span>
                </a>
              )}
              <a
                className={`rap-knop ${volledigUrl ? "rap-knop-stil" : "rap-knop-accent"}`}
                href={`mailto:${CONTACT_MAIL}`}
              >
                Plan een gesprek
              </a>
              <span className="rap-alleen-scherm">
                <AfdrukKnop label="Samenvatting als PDF" />
              </span>
            </div>
          </div>
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
