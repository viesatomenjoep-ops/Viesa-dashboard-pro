import type { Herkomst } from "@/lib/rapport/types";
import { getal } from "@/lib/rapport/schaal";

/**
 * Regel 3 uit het bouwplan: waar de cijfers vandaan komen.
 *
 * Dit blok is het verschil tussen een meting en een mening. Elke waarde komt
 * van een genoemd instrument in een genoemde versie, op een genoemd moment —
 * dus is verschil bij een volgende scan écht verschil, en niet een andere
 * meetmethode. Het staat achteraan omdat je het pas nodig hebt als je de
 * uitkomst wilt narekenen, en niet ervoor.
 */
export function HerkomstBlok({
  herkomst,
  nietBeoordeeld,
}: {
  herkomst: Herkomst;
  nietBeoordeeld: string[];
}) {
  const gemeten = new Date(herkomst.gemetenOp);
  const datum = gemeten.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const tijd = gemeten.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="rap-onderdeel" id="onderdeel-herkomst">
      <div className="rap-breed">
        <div className="rap-stapel" style={{ gap: 30 }}>
          <div className="rap-stapel rap-lees" style={{ gap: 13 }}>
            <span className="rap-label rap-label-accent">Herkomst</span>
            <h2>Deze meting kunnen we over een maand precies zo herhalen</h2>
            <p className="rap-klein">
              Elke waarde in dit rapport komt van een genoemd instrument onder genoemde
              omstandigheden, vastgelegd op {datum} om {tijd} uur. Daardoor is verschil bij een
              volgende scan ook echt verschil, en niet een andere meetmethode.
            </p>
          </div>

          <div className="rap-herkomst-cijfers">
            <div className="rap-herkomst-cijfer">
              <b>{herkomst.paginas}</b>
              <span className="rap-label">pagina&apos;s</span>
            </div>
            <div className="rap-herkomst-cijfer">
              <b>{herkomst.controles}</b>
              <span className="rap-label">controles</span>
            </div>
            <div className="rap-herkomst-cijfer">
              <b>{getal(herkomst.rekentijdSeconden)} s</b>
              <span className="rap-label">rekentijd</span>
            </div>
            {herkomst.instrumenten.map((i) => (
              <div key={i.naam} className="rap-herkomst-cijfer">
                <b>{i.versie}</b>
                <span className="rap-label">{i.naam}</span>
              </div>
            ))}
            <div className="rap-herkomst-cijfer">
              <b>{herkomst.scoremodel}</b>
              <span className="rap-label">scoremodel</span>
            </div>
          </div>

          {/* Regel 4: eerlijk over wat we niet weten. */}
          {nietBeoordeeld.length > 0 && (
            <div className="rap-kaart rap-stapel" style={{ gap: 13 }}>
              <span className="rap-label">
                {nietBeoordeeld.length} {nietBeoordeeld.length === 1 ? "punt" : "punten"} die we niet
                automatisch konden beoordelen
              </span>
              <p className="rap-klein rap-lees">
                Deze punten tellen in geen van beide richtingen mee. Ze staan hier omdat een meting
                die overal een antwoord op heeft, geen eerlijke meting is.
              </p>
              <ul className="rap-klein" style={{ margin: 0, paddingLeft: "1.15em", display: "flex", flexDirection: "column", gap: 5 }}>
                {nietBeoordeeld.map((punt) => (
                  <li key={punt}>{punt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
