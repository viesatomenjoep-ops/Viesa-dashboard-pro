import type { Onderdeel } from "@/lib/rapport/types";
import { standVanScore } from "@/lib/rapport/schaal";

/**
 * De meelopende balk met alle onderdelen, hun cijfer en een gekleurde stip.
 *
 * Bewust ankerlinks en geen JavaScript: dit is een leesdocument, geen
 * toepassing. Het scrollt van nature naar het juiste onderdeel, werkt zonder
 * client-component, en verdwijnt op papier (zie @media print).
 */
export function Tabbalk({ onderdelen }: { onderdelen: Onderdeel[] }) {
  return (
    <nav className="rap-tabs rap-alleen-scherm" aria-label="Onderdelen">
      <div className="rap-tabs-rij">
        {onderdelen.map((o) => {
          const stand = standVanScore(o.score, o.norm);
          return (
            <a key={o.sleutel} className="rap-tab" href={`#onderdeel-${o.sleutel}`}>
              <span className="rap-tab-naam">{o.naam}</span>
              <span className="rap-tab-cijfer">
                {o.score === null ? "—" : o.score}
                {o.score !== null && (
                  <span className="rap-stip" style={{ background: `var(--${stand})` }} aria-hidden="true" />
                )}
              </span>
            </a>
          );
        })}
        <a className="rap-tab" href="#onderdeel-herkomst">
          <span className="rap-tab-naam">Herkomst</span>
          <span className="rap-tab-cijfer">—</span>
        </a>
      </div>
    </nav>
  );
}
