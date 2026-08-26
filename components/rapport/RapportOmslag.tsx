import type { Rapport } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";
import { Merkregel } from "./Merkregel";
import { Ringgrafiek } from "./Ringgrafiek";
import { Laptopbeeld } from "./Laptopbeeld";

/** Datum als "26 augustus 2026". */
function datumLang(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * De omslag: wie het rapport maakte, over welke site het gaat, en het
 * totaaloordeel in één cijfer.
 *
 * De site van de klant staat rechts in een laptop, en dat is met opzet het
 * eerste wat hij ziet. Een rapport dat opent met een cijfer gaat over ons
 * oordeel; een rapport dat opent met zijn eigen homepage gaat over hem — en dan
 * leest hij het cijfer ernaast als iets dat over zijn werk gaat in plaats van
 * als een rapportcijfer van een onbekende.
 */
export function RapportOmslag({
  rapport,
  korteUrl,
}: {
  rapport: Rapport;
  korteUrl?: string | null;
}) {
  const { totaalScore, host, bedrijf, herkomst, onderdelen, schermafdruk } = rapport;
  const stand = standVanScore(totaalScore, 80);

  const gemeten = onderdelen.filter((o) => o.score !== null);
  const opGroen = gemeten.filter((o) => o.score !== null && o.score >= o.norm).length;
  const kansen = onderdelen.reduce((n, o) => n + o.bevindingen.filter((b) => !b.goed).length, 0);

  return (
    <header className="rap-omslag">
      <div className="rap-breed">
        <div className="rap-merkregel">
          <Merkregel toon="donker" />
        </div>

        <span className="rap-merknaam">
          Deep Scan · {host} · {datumLang(herkomst.gemetenOp)}
        </span>

        <div className="rap-omslag-raster">
          <div className="rap-stapel" style={{ gap: 26 }}>
            <div className="rap-stapel" style={{ gap: 12 }}>
              <h1>{bedrijf ?? host}</h1>
              <p style={{ color: "#B9C2D4", fontSize: "1.08rem", maxWidth: "40ch" }}>
                {totaalScore === null
                  ? "Er kon te weinig gemeten worden voor één totaaloordeel."
                  : `Zeven onderdelen gemeten, elk met zijn eigen norm. Dit is wat eruit kwam.`}
              </p>
            </div>

            <div className="rap-omslag-cijfer">
              <Ringgrafiek score={totaalScore} norm={80} maat={132} toonNorm={false} toonOordeel={false} />
              <div className="rap-stapel" style={{ gap: 6 }}>
                <span className="rap-omslag-stand" style={{ color: `var(--${stand})` }}>
                  {totaalScore === null ? "Niet te bepalen" : STAND_LABEL[stand]}
                </span>
                <span className="rap-klein" style={{ color: "#8FA1BD" }}>
                  {kansen > 0
                    ? `${kansen} ${kansen === 1 ? "kans" : "kansen"} gevonden`
                    : "Geen openstaande punten"}
                </span>
              </div>
            </div>

            {korteUrl && (
              <p className="rap-alleen-scherm">
                <a href={korteUrl} className="rap-omslag-link">
                  Liever de samenvatting van één pagina?
                </a>
              </p>
            )}
          </div>

          <div className="rap-omslag-beeld">
            <Laptopbeeld afbeelding={schermafdruk} host={host} toon="donker" />
            <span className="rap-omslag-bijschrift">Uw site, zoals wij hem tijdens de scan zagen</span>
          </div>
        </div>

        <div className="rap-tegels">
          <div className="rap-tegel">
            <b>{gemeten.length}</b>
            <span>onderdelen gemeten</span>
          </div>
          <div className="rap-tegel">
            <b style={{ color: opGroen > 0 ? "var(--goed)" : undefined }}>{opGroen}</b>
            <span>al op de norm</span>
          </div>
          <div className="rap-tegel">
            <b style={{ color: kansen > 0 ? "var(--beter)" : undefined }}>{kansen}</b>
            <span>kansen gevonden</span>
          </div>
          <div className="rap-tegel">
            <b>{herkomst.controles}</b>
            <span>controles gedaan</span>
          </div>
        </div>
      </div>
    </header>
  );
}
