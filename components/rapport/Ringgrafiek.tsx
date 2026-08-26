import { STAND_LABEL, standVanScore } from "@/lib/rapport/schaal";

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
}: {
  score: number | null;
  norm: number;
  maat?: number;
  toonNorm?: boolean;
}) {
  const stand = standVanScore(score, norm);
  const kleur = `var(--${stand === "geen" ? "geen" : stand})`;

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
              <b style={{ fontSize: maat * 0.3 }}>{score}</b>
              <span>/ 100</span>
            </>
          )}
        </span>
      </div>
      <span className="rap-ring-oordeel" style={{ color: kleur }}>
        {STAND_LABEL[stand]}
      </span>
      {toonNorm && (
        <span className="rap-ring-norm">
          {score === null ? "niet gemeten" : `norm: ${norm} of hoger`}
        </span>
      )}
    </div>
  );
}
