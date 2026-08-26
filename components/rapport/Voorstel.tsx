import { DIENSTEN, PIJLERS, REVIEW, KERNBELOFTE, AUDIT_BELOFTE } from "@/lib/aanbod";
import { merkKlassen } from "@/lib/rapport/fonts";
import { CONTACT_MAIL } from "@/lib/rapport/contact";
import { Merkregel } from "./Merkregel";
import { Contactblok } from "./Contactblok";
import { AfdrukKnop } from "./AfdrukKnop";
import "./rapport.css";
import "./voorstel.css";

/**
 * Het voorstel: wat Viesa aanbiedt, in de huisstijl van het rapport en
 * afdrukbaar als derde PDF naast de korte en de lange Deep Scan.
 *
 * Dezelfde teksten als de promotiemail (beide lezen uit lib/aanbod.ts), maar
 * een heel andere opmaak. Dat is geen dubbel werk maar het punt: e-mail is
 * geen webpagina — daar moet alles in tabellen met inline stijlen en zonder
 * webfont, want Gmail en Outlook slopen de rest. Hier mag het wél: echte CSS,
 * Archivo, gekleurde vlakken die op papier doorlopen tot de rand.
 *
 * De volgorde is die van een gesprek: eerst wat er te winnen valt, dan wat we
 * bouwen, dan waarom wij, en pas onderaan de vraag. Wie alleen het eerste vel
 * leest weet genoeg om ja te zeggen tegen een audit.
 */
export function Voorstel({
  bedrijf,
  host,
  /** De Deep Scan, als er een bij hoort — dan verwijst het voorstel ernaar. */
  rapportUrl,
  korteUrl,
  score,
}: {
  bedrijf?: string | null;
  host?: string | null;
  rapportUrl?: string | null;
  korteUrl?: string | null;
  score?: number | null;
}) {
  const naam = bedrijf?.trim() || host || null;
  const doelHost = host || "uw website";

  return (
    <div className={`rap vst ${merkKlassen}`}>
      <header className="rap-omslag vst-omslag">
        <div className="rap-breed">
          <div className="rap-merkregel">
            <Merkregel toon="donker" />
          </div>
          <span className="rap-merknaam">
            Voorstel{naam ? ` · ${naam}` : ""}
          </span>

          <h1 className="vst-titel">{KERNBELOFTE}</h1>

          <p className="vst-onderkop">
            In vrijwel elk bedrijf zit werk dat elke week terugkomt en dat niemand
            leuk vindt: dezelfde vragen beantwoorden, gegevens overtypen tussen
            twee systemen, achter offertes aanbellen. Dat werk kan weg — niet door
            harder te werken, maar door het aan een agent over te laten die het
            foutloos doet.
          </p>

          <div className="vst-kernen">
            {["AI-agents", "Telefonie", "Chat", "E-mail", "Workflows", "Dashboards"].map((k) => (
              <span key={k} className="vst-kern">
                {k}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="vst-blok">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 8, marginBottom: 24 }}>
            <span className="rap-label rap-label-accent">Zes pijlers, één aanspreekpunt</span>
            <h2>Wat wij voor u kunnen bouwen</h2>
          </div>

          <div className="vst-raster">
            {DIENSTEN.map((d, i) => (
              <article key={d.sleutel} className="vst-kaart">
                <span className="vst-kaart-band" aria-hidden="true" />
                <span className="vst-kaart-nr">
                  {String(i + 1).padStart(2, "0")} · {d.categorie}
                </span>
                <h3 className="vst-kaart-titel">{d.naam}</h3>
                <p className="vst-kaart-belofte">{d.belofte}</p>
                <p className="vst-kaart-opbrengst">
                  <span className="vst-opbrengst-label">Levert op</span>
                  {d.opbrengst}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(rapportUrl || korteUrl) && (
        <section className="vst-scan">
          <div className="rap-breed">
            <div className="vst-scankaart">
              <div className="rap-stapel" style={{ gap: 10, flex: "1 1 320px" }}>
                <span className="rap-label rap-label-accent">We keken alvast mee</span>
                <h2 style={{ fontSize: "1.5rem" }}>
                  Uw Deep Scan staat klaar{host ? ` voor ${doelHost}` : ""}
                </h2>
                <p className="rap-lees rap-klein">
                  {typeof score === "number"
                    ? `Zeven onderdelen gemeten, elk met zijn eigen norm. Het totaal kwam uit op ${score} van 100 — in het rapport staat per onderdeel wat daarachter zit.`
                    : "Zeven onderdelen gemeten, elk met zijn eigen norm. In het rapport staat per onderdeel wat goed staat en waar te winnen valt."}
                </p>
                <div className="rap-knoppen">
                  {korteUrl && (
                    <a className="rap-knop" href={korteUrl}>
                      Samenvatting van één pagina
                    </a>
                  )}
                  {rapportUrl && (
                    <a className="rap-knop rap-knop-stil" href={rapportUrl}>
                      Volledig rapport
                    </a>
                  )}
                </div>
              </div>

              {typeof score === "number" && (
                <div className="vst-scancijfer">
                  <b>{score}</b>
                  <span>van 100</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="vst-waarom rap-op-donker">
        <div className="rap-breed">
          <div className="rap-stapel" style={{ gap: 8, marginBottom: 24 }}>
            <span className="rap-label" style={{ color: "var(--accent)" }}>
              Waarom Viesa
            </span>
            <h2 style={{ color: "var(--zand)" }}>Waarom bedrijven voor ons kiezen</h2>
          </div>

          <div className="vst-pijlers">
            {PIJLERS.map((p) => (
              <div key={p.naam} className="vst-pijler">
                <span className="vst-pijler-stip" aria-hidden="true" />
                <h3 className="vst-pijler-naam">{p.naam}</h3>
                <p className="vst-pijler-uitleg">{p.uitleg}</p>
              </div>
            ))}
          </div>

          <blockquote className="vst-review">
            <span className="vst-sterren" aria-label="Vijf van de vijf sterren">
              ★★★★★
            </span>
            <p className="vst-review-tekst">&ldquo;{REVIEW.tekst}&rdquo;</p>
            <footer className="vst-review-bron">{REVIEW.bron}</footer>
          </blockquote>
        </div>
      </section>

      <section id="afspraak" className="vst-slot rap-op-donker">
        <div className="rap-breed">
          <Contactblok
            host={doelHost}
            kop="Klaar om uw bedrijf te automatiseren?"
            lees={AUDIT_BELOFTE}
          />
          <span className="rap-alleen-scherm" style={{ display: "inline-block", marginTop: 18 }}>
            <AfdrukKnop label="Voorstel als PDF" />
          </span>
        </div>
      </section>

      <footer className="vst-voetregel">
        <div
          className="rap-breed"
          style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}
        >
          <Merkregel toon="donker" hoogte={26} />
          <span className="rap-klein" style={{ color: "#8FA1BD" }}>
            Breda · {CONTACT_MAIL}
          </span>
        </div>
      </footer>
    </div>
  );
}
