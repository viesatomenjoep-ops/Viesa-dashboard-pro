import type { CSSProperties } from "react";
import { STAND_LABEL, standVanScore } from "@/lib/rapport/schaal";

/**
 * De lettergrootte van het cijfer, naar het aantal cijfers.
 *
 * Zonder dit loopt een score van 100 dwars door de "/100" heen: drie cijfers
 * zijn anderhalf keer zo breed als twee, en de ruimte binnen de ring verandert
 * niet mee. Eén vaste maat past dus alleen voor twee cijfers.
 */
function cijferMaat(score: number | null): number {
  if (score === null) return 0.3;
  if (score >= 100) return 0.2;
  if (score >= 10) return 0.3;
  return 0.34;
}

/**
 * De normregel onder de ring.
 *
 * "norm: 100 of hoger" leest raar als honderd het maximum is — dan is er geen
 * "hoger". Bij een norm van 100 betekent het simpelweg dat alles moet kloppen,
 * en dat zeggen we dan ook zo.
 */
function normTekst(score: number | null, norm: number): string {
  if (score === null) return "niet gemeten";
  if (norm >= 100) return "norm: alles moet werken";
  return `norm: ${norm} of hoger`;
}

/**
 * De scorering met de norm eronder — regel 1 uit het bouwplan: geen cijfer
 * zonder zijn drempel ernaast.
 *
 * Een score van `null` betekent "niet gemeten": dan komt er een streepje in
 * plaats van een nul, want een dienst die haperde mag niet lezen als een
 * slechte site.
 */
export function Ringgrafiek({
  score,
  norm,
  maat = 116,
  toonNorm = true,
  toonOordeel = true,
}: {
  score: number | null;
  norm: number;
  maat?: number;
  toonNorm?: boolean;
  /**
   * Op de omslag staat het oordeel al groot naast de ring. Het er dan óók
   * onder zetten leest als twee verschillende uitspraken over hetzelfde
   * cijfer.
   */
  toonOordeel?: boolean;
}) {
  const stand = standVanScore(score, norm);
  const kleur = `var(--${stand === "geen" ? "geen" : stand})`;
  const cijferSchaal = cijferMaat(score);

  const dikte = Math.round(maat * 0.086);
  const straal = (maat - dikte) / 2;
  const omtrek = 2 * Math.PI * straal;
  const deel = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="rap-ring">
      <div className="rap-ring-vlak">
        <svg width={maat} height={maat} viewBox={`0 0 ${maat} ${maat}`} aria-hidden="true">
          <circle
            cx={maat / 2}
            cy={maat / 2}
            r={straal}
            fill="none"
            stroke="var(--lijn)"
            strokeWidth={dikte}
          />
          {score !== null && (
            <circle
              cx={maat / 2}
              cy={maat / 2}
              r={straal}
              fill="none"
              stroke={kleur}
              strokeWidth={dikte}
              className="rap-ring-boog"
              /* De begin- en eindstand als custom property, zodat de CSS de
                 boog kan laten tekenen zonder per cijfer een eigen keyframe.
                 Zie components/rapport/beweging.css. */
              style={
                {
                  "--rap-ring-leeg": omtrek,
                  "--rap-ring-doel": omtrek * (1 - deel),
                } as CSSProperties
              }
              strokeLinecap="round"
              strokeDasharray={omtrek}
              strokeDashoffset={omtrek * (1 - deel)}
            />
          )}
        </svg>
        <span className="rap-ring-cijfer">
          {score === null ? (
            <b style={{ fontSize: maat * 0.3, color: "var(--zacht)" }}>—</b>
          ) : (
            <>
              <b style={{ fontSize: maat * cijferSchaal }}>{score}</b>
              <span style={{ fontSize: maat * 0.093 }}>/100</span>
            </>
          )}
        </span>
      </div>
      {toonOordeel && (
        <span className="rap-ring-oordeel" style={{ color: kleur }}>
          {STAND_LABEL[stand]}
        </span>
      )}
      {toonNorm && <span className="rap-ring-norm">{normTekst(score, norm)}</span>}
    </div>
  );
}
