import type { Bevinding, Ernst, Vaststelling } from "@/lib/rapport/types";

/**
 * De kleinere bouwstenen van een onderdeel: een enkele vaststelling (ja/nee met
 * een oordeel ernaast) en een bevinding (wat er is, waarom het uitmaakt, en wat
 * eraan te doen).
 *
 * Bevindingen staan als kaarten in een raster en niet meer als lijst. Een lijst
 * van vijftien regels leest een klant niet; vijftien gekleurde kaartjes scant
 * hij wél, en hij ziet in één blik hoeveel rood er tussen staat. De kleur zit
 * in de rand en de kop, nooit in het vlak — anders wordt een pagina met veel
 * bevindingen één bonte lap en verdwijnt juist het onderscheid.
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

/** Welke standkleur bij een bevinding hoort — dat stuurt de rand van de kaart. */
function standVan(b: Bevinding): "goed" | "beter" | "nodig" | "geen" {
  if (b.goed) return "goed";
  if (b.ernst === "ernstig") return "nodig";
  if (b.ernst === "info") return "geen";
  return "beter";
}

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
            <Teken goed={goed} />
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

/** Eén bevinding als kaart: gekleurde rand, teken, kop, uitleg, advies. */
export function BevindingKaart({ bevinding }: { bevinding: Bevinding }) {
  const stand = standVan(bevinding);
  return (
    <li className={`bev bev-${stand}`}>
      <div className="bev-kop">
        <span className="bev-teken" style={{ background: `var(--${stand})` }} aria-hidden="true">
          <Teken goed={bevinding.goed} />
        </span>
        <h3 className="bev-titel">{bevinding.titel}</h3>
      </div>

      {bevinding.aantal && (
        <span className="bev-aantal" style={{ color: `var(--${stand})`, background: `var(--${stand}-vlak)` }}>
          {bevinding.aantal}
        </span>
      )}

      <p className="bev-uitleg">{bevinding.uitleg}</p>

      {bevinding.advies && (
        <p className="bev-advies">
          <span className="bev-advies-label">Wat te doen</span>
          {bevinding.advies}
        </p>
      )}
    </li>
  );
}

export function BevindingenLijst({ bevindingen }: { bevindingen: Bevinding[] }) {
  if (bevindingen.length === 0) return null;
  return (
    <ul className="bev-raster">
      {bevindingen.map((b, i) => (
        <BevindingKaart key={`${b.titel}-${i}`} bevinding={b} />
      ))}
    </ul>
  );
}

/** Vinkje of kruisje, in wit op de standkleur. */
function Teken({ goed }: { goed: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {goed ? (
        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 7v7M12 17.4v.2" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
