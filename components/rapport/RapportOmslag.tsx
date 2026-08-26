import type { Rapport } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";
import { Merkregel } from "./Merkregel";
import { Ringgrafiek } from "./Ringgrafiek";

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
 * totaaloordeel in één cijfer. Op papier is dit de voorpagina — daarna begint
 * elk onderdeel op een eigen vel.
 */
export function RapportOmslag({ rapport }: { rapport: Rapport }) {
  const { totaalScore, host, bedrijf, herkomst, onderdelen } = rapport;
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

        <div
          style={{
            display: "flex",
            gap: 34,
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 26,
          }}
        >
          <Ringgrafiek score={totaalScore} norm={80} maat={132} toonNorm={false} />
          <div className="rap-stapel" style={{ gap: 12, flex: "1 1 300px" }}>
            <h1>{bedrijf ?? host}</h1>
            <p style={{ color: "#B9C2D4", fontSize: "1.08rem", maxWidth: "44ch" }}>
              {totaalScore === null ? (
                "Er kon te weinig gemeten worden voor één totaaloordeel."
              ) : (
                <>
                  <b style={{ color: `var(--${stand})` }}>{STAND_LABEL[stand]}</b> · {totaalScore} van 100
                  {kansen > 0 && ` · ${kansen} ${kansen === 1 ? "kans" : "kansen"} gevonden`}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="rap-tegels">
          <div className="rap-tegel">
            <b>{gemeten.length}</b>
            <span>onderdelen gemeten</span>
          </div>
          <div className="rap-tegel">
            <b>{opGroen}</b>
            <span>al op de norm</span>
          </div>
          <div className="rap-tegel">
            <b>{kansen}</b>
            <span>kansen gevonden</span>
          </div>
          <div className="rap-tegel">
            <b>{herkomst.paginas}</b>
            <span>pagina&apos;s bekeken</span>
          </div>
        </div>
      </div>
    </header>
  );
}
