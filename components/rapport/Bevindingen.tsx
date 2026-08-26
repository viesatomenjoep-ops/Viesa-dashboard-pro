import type { Bevinding, Ernst, Vaststelling } from "@/lib/rapport/types";

/**
 * De kleinere bouwstenen van een onderdeel: een enkele vaststelling (ja/nee met
 * een oordeel ernaast) en een bevinding (wat er is, waarom het uitmaakt, en wat
 * eraan te doen).
 */

const ERNST_LABEL: Record<Ernst, string> = {
  ernstig: "Ernstig",
  gemiddeld: "Gemiddeld",
  licht: "Licht",
  info: "Info",
};

/** Ernst bepaalt alleen de kleur van de chip, nooit die van de omliggende tekst. */
const ERNST_KLEUR: Record<Ernst, { tekst: string; vlak: string }> = {
  ernstig: { tekst: "var(--nodig)", vlak: "var(--nodig-vlak)" },
  gemiddeld: { tekst: "var(--beter)", vlak: "var(--beter-vlak)" },
  licht: { tekst: "var(--beter)", vlak: "var(--beter-vlak)" },
  info: { tekst: "var(--gedempt)", vlak: "var(--geen-vlak)" },
};

export function ErnstChip({ ernst }: { ernst: Ernst }) {
  const kleur = ERNST_KLEUR[ernst];
  return (
    <span className="rap-chip" style={{ color: kleur.tekst, background: kleur.vlak }}>
      {ERNST_LABEL[ernst]}
    </span>
  );
}

/** Het groene of rode balkje met één uitkomst — "Ja · Goed". */
export function VaststellingRegel({ vaststelling }: { vaststelling: Vaststelling }) {
  const { stand } = vaststelling;
  const goed = stand === "goed";
  return (
    <div className="rap-stapel" style={{ gap: 7 }}>
      <div className="rap-meting-kop">
        <span className="rap-stip" style={{ background: `var(--${stand})` }} aria-hidden="true" />
        <h3>{vaststelling.titel}</h3>
      </div>
      <p className="rap-klein rap-lees">{vaststelling.uitleg}</p>
      <div className="rap-vaststelling" style={{ background: `var(--${stand}-vlak)` }}>
        <span className="rap-vaststelling-links">
          <span className="rap-vinkje" style={{ background: `var(--${stand})` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {goed ? (
                <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
              )}
            </svg>
          </span>
          <span className="rap-vaststelling-antwoord">{vaststelling.antwoord}</span>
        </span>
        <span className="rap-vaststelling-stand" style={{ color: `var(--${stand})` }}>
          {goed ? "Goed" : stand === "beter" ? "Kan beter" : stand === "nodig" ? "Aandacht nodig" : "Onbekend"}
        </span>
      </div>
    </div>
  );
}

export function BevindingRegel({ bevinding }: { bevinding: Bevinding }) {
  return (
    <li className="rap-bevinding">
      <span className="rap-bevinding-kop">
        {!bevinding.goed && <ErnstChip ernst={bevinding.ernst} />}
        <h3 style={{ fontSize: "1.02rem" }}>
          {bevinding.aantal ? `${bevinding.aantal}: ${bevinding.titel}` : bevinding.titel}
        </h3>
      </span>
      <p className="rap-klein rap-lees">{bevinding.uitleg}</p>
      {bevinding.advies && (
        <p className="rap-klein rap-lees" style={{ color: "var(--tekst)" }}>
          {bevinding.advies}
        </p>
      )}
    </li>
  );
}

export function BevindingenLijst({ bevindingen }: { bevindingen: Bevinding[] }) {
  if (bevindingen.length === 0) return null;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {bevindingen.map((b, i) => (
        <BevindingRegel key={`${b.titel}-${i}`} bevinding={b} />
      ))}
    </ul>
  );
}
