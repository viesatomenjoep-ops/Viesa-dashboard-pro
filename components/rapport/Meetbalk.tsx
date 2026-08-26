import type { Meting } from "@/lib/rapport/types";
import { asDecimalen, asWaarden, getal, positieOp, standVan, zoneBreedtes } from "@/lib/rapport/schaal";

/**
 * De meetbalk: een as met gekleurde zones, de zonenamen erboven, de gemeten
 * waarde als vlag met een steeltje naar zijn punt, en de zonegrenzen eronder.
 *
 * Dit is het element dat een cijfer omzet in een oordeel zonder dat de lezer
 * de norm hoeft te kennen: je ziet meteen of de stip in het groene of het rode
 * stuk staat, en hoe ver hij van de grens af zit.
 */
export function Meetbalk({ meting }: { meting: Meting }) {
  const { schaal, waarde } = meting;
  const stand = standVan(schaal, waarde);
  const breedtes = zoneBreedtes(schaal);
  const tikken = asWaarden(schaal);
  // Eén decimaalaantal voor de hele as, ruim genoeg om geen grens af te ronden.
  const decimalen = asDecimalen(schaal);
  const positie = waarde === null ? null : positieOp(schaal, waarde);

  // Het midden van elke zone, om de zonenaam boven zijn eigen stuk te zetten.
  const zoneMiddens: number[] = [];
  let gelopen = 0;
  for (const breedte of breedtes) {
    zoneMiddens.push(gelopen + breedte / 2);
    gelopen += breedte;
  }

  return (
    <div className="rap-meting">
      <div className="rap-meting-kop">
        <span className="rap-stip" style={{ background: `var(--${stand})` }} aria-hidden="true" />
        <h3>{meting.titel}</h3>
      </div>
      <p className="rap-klein rap-lees">{meting.uitleg}</p>

      <div className="rap-balk">
        <div className="rap-balk-vlak">
          {/* De vlag met de gemeten waarde. Staat bóven de zonenamen; het
              steeltje loopt er dwars doorheen naar de punt op de balk. */}
          {positie !== null && meting.weergave && (
            <span className="rap-balk-vlag" style={{ left: `${positie}%`, color: `var(--${stand})` }}>
              <b>{meting.weergave}</b>
              <span className="rap-balk-steel" style={{ background: `var(--${stand})` }} />
            </span>
          )}

          {/* Zonenamen, elk boven zijn eigen stuk van de as */}
          <div className="rap-balk-namen">
            {schaal.zones.map((zone, i) => (
              <span
                key={zone.label}
                className="rap-balk-naam"
                style={{ left: `${zoneMiddens[i]}%`, color: `var(--${zone.stand})` }}
              >
                {zone.label}
              </span>
            ))}
          </div>

          {/* De as zelf, met de punt op de gemeten waarde */}
          <div className="rap-balk-spoor">
            <div className="rap-balk-zones">
              {schaal.zones.map((zone, i) => (
                <span
                  key={zone.label}
                  className="rap-balk-zone"
                  style={{ width: `${breedtes[i]}%`, background: `var(--${zone.stand})` }}
                />
              ))}
            </div>

            {positie !== null && (
              <span
                className="rap-balk-punt"
                style={{ left: `${positie}%`, background: `var(--${stand})` }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Zonegrenzen. De eerste links uitgelijnd, de laatste rechts, zodat de
            buitenste getallen niet half buiten de balk hangen. */}
        <div className="rap-balk-as">
          {tikken.map((tik, i) => {
            const deel = ((tik - tikken[0]) / (tikken[tikken.length - 1] - tikken[0] || 1)) * 100;
            const eerste = i === 0;
            const laatste = i === tikken.length - 1;
            return (
              <span
                key={tik}
                className="rap-balk-tik"
                style={{
                  left: eerste ? 0 : laatste ? undefined : `${deel}%`,
                  right: laatste ? 0 : undefined,
                  transform: eerste || laatste ? undefined : "translateX(-50%)",
                }}
              >
                {getal(tik, Number.isInteger(tik) ? 0 : decimalen)}
              </span>
            );
          })}
        </div>
      </div>

      <p className="rap-klein rap-lees" style={{ color: "var(--tekst)" }}>
        {meting.duiding}
      </p>
    </div>
  );
}
