import type { Onderdeel } from "@/lib/rapport/types";
import { standVanScore, STAND_LABEL } from "@/lib/rapport/schaal";

/**
 * Alle zeven onderdelen in één beeld, meteen na de omslag.
 *
 * Dit is het blad waar de klant naar wijst tijdens het gesprek. Zeven balken,
 * elk met zijn eigen norm als streepje erop: waar de balk de streep niet haalt,
 * is werk. Geen tabel met cijfers — een cijfer moet je lezen en vergelijken, een
 * balk zie je in één blik.
 *
 * De kleur zegt alles wat de tekst anders zou moeten zeggen. Groen is op de
 * norm, amber kan beter, rood vraagt aandacht, en gearceerd grijs betekent
 * "niet gemeten" — dat laatste bewust als patroon en niet als kleur, zodat een
 * ontbrekende meting nooit leest als een slechte uitslag.
 */
export function Scorematrix({ onderdelen }: { onderdelen: Onderdeel[] }) {
  return (
    <div className="mtx">
      {onderdelen.map((o) => {
        const stand = standVanScore(o.score, o.norm);
        const gemeten = o.score !== null;
        // Bij een norm van 100 ("alles moet werken") staat de streep aan het
        // eind van de balk; de vulling is dan alles-of-niets.
        const vulling = gemeten ? Math.max(2, Math.min(100, o.score!)) : 0;
        const gemist = o.bevindingen.filter((b) => !b.goed).length;
        const goed = o.bevindingen.filter((b) => b.goed).length;

        return (
          <div key={o.sleutel} className={`mtx-rij mtx-${stand}`}>
            <div className="mtx-naam">
              <span className="mtx-nr">{String(o.nummer).padStart(2, "0")}</span>
              <span className="mtx-titel">{o.naam}</span>
            </div>

            <div className="mtx-spoor" role="img" aria-label={`${o.naam}: ${gemeten ? `${o.score} van 100, norm ${o.norm}` : "niet gemeten"}`}>
              {gemeten ? (
                <span className="mtx-vul" style={{ width: `${vulling}%`, background: `var(--${stand})` }} />
              ) : (
                <span className="mtx-ongemeten" />
              )}
              {/* De norm als streep dwars over de balk — zonder dat referentie­
                  punt zegt een gevulde balk niets. */}
              <span className="mtx-norm" style={{ left: `${Math.min(99.4, o.norm)}%` }} aria-hidden="true" />
            </div>

            <div className="mtx-cijfer">
              <b style={{ color: gemeten ? `var(--${stand})` : "var(--zacht)" }}>
                {gemeten ? o.score : "—"}
              </b>
              <span className="mtx-norm-tekst">norm {o.norm}</span>
            </div>

            <div className="mtx-stand">
              <span className="mtx-chip" style={{ background: `var(--${stand}-vlak)`, color: `var(--${stand})` }}>
                {gemeten ? STAND_LABEL[stand] : "Niet gemeten"}
              </span>
              {o.bevindingen.length > 0 && (
                <span className="mtx-telling">
                  <b style={{ color: "var(--goed)" }}>{goed}</b> goed ·{" "}
                  <b style={{ color: gemist > 0 ? "var(--nodig)" : "var(--zacht)" }}>{gemist}</b> te doen
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
