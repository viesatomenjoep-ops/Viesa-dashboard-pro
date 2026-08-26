import type { Meetschaal, Stand, Zone } from "./types";

/**
 * De rekenkant van de meetbalk: waar staat de markering, en in welke zone valt
 * de waarde.
 *
 * Bewust los van de component en zonder `server-only`, want dit is precies het
 * soort rekenwerk dat stil verkeerd gaat — een waarde die net buiten de as valt,
 * een zone met een gelijke grens — en dat je dus apart wilt kunnen testen.
 */

/** Het maximum van de as: de bovengrens van de laatste zone. */
export function maximumVan(schaal: Meetschaal): number {
  if (schaal.zones.length === 0) return 0;
  return schaal.zones[schaal.zones.length - 1].tot;
}

export function minimumVan(schaal: Meetschaal): number {
  return schaal.vanaf ?? 0;
}

/**
 * De zone waar een waarde in valt.
 *
 * Grenzen horen bij de zone eronder (`<=`): 1,8 s op een schaal die tot 1,8
 * "snel" heet, is snel. Een waarde boven de as valt in de laatste zone — een
 * laadtijd van 30 seconden is niet "buiten de schaal", die is gewoon traag.
 */
export function zoneVan(schaal: Meetschaal, waarde: number): Zone | null {
  if (schaal.zones.length === 0) return null;
  for (const zone of schaal.zones) {
    if (waarde <= zone.tot) return zone;
  }
  return schaal.zones[schaal.zones.length - 1];
}

/** De stand van een waarde: hetzelfde als de zone waarin hij valt. */
export function standVan(schaal: Meetschaal, waarde: number | null): Stand {
  if (waarde === null) return "geen";
  return zoneVan(schaal, waarde)?.stand ?? "geen";
}

/**
 * De positie van de markering, als percentage van de aslengte (0–100).
 *
 * Afgekapt op beide uiteinden: een waarde die ver buiten de as valt, hoort nog
 * steeds zichtbaar op de balk te staan in plaats van erbuiten te verdwijnen.
 */
export function positieOp(schaal: Meetschaal, waarde: number): number {
  const min = minimumVan(schaal);
  const max = maximumVan(schaal);
  if (max <= min) return 0;
  const deel = ((waarde - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, deel));
}

/**
 * De breedte van elke zone, als percentage — voor de gekleurde segmenten.
 * Telt altijd op tot 100, zodat er geen haarlijn wit tussen de segmenten valt.
 */
export function zoneBreedtes(schaal: Meetschaal): number[] {
  const min = minimumVan(schaal);
  const max = maximumVan(schaal);
  if (max <= min) return schaal.zones.map(() => 0);

  let vorige = min;
  return schaal.zones.map((zone) => {
    const breedte = ((zone.tot - vorige) / (max - min)) * 100;
    vorige = zone.tot;
    return Math.max(0, breedte);
  });
}

/**
 * De waarden onder de as: de ondergrens plus elke zonegrens. Dit zijn de
 * getallen die in het rapport onder de balk staan (0 · 1,8 s · 3,0 s · 5,0 s).
 */
export function asWaarden(schaal: Meetschaal): number[] {
  return [minimumVan(schaal), ...schaal.zones.map((z) => z.tot)];
}

/** Nederlandse getalweergave: komma als decimaalteken. */
export function getal(waarde: number, decimalen = 0): string {
  return waarde.toLocaleString("nl-NL", {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  });
}

/**
 * Hoeveel decimalen de as nodig heeft om élke grens juist te tonen.
 *
 * Eén vaste waarde per as, niet per getal: anders staat er "0 · 1,8 · 3 · 5"
 * op één balk. En genoeg decimalen om afronding te voorkomen — met één
 * decimaal werd de grens 0,25 als "0,3" getoond, en dan klopt het label niet
 * meer met de plek waar het segment werkelijk overgaat.
 */
export function asDecimalen(schaal: Meetschaal, maximum = 3): number {
  let nodig = 0;
  for (const waarde of asWaarden(schaal)) {
    for (let d = 0; d <= maximum; d++) {
      if (Math.abs(waarde - Number(waarde.toFixed(d))) < 1e-9) {
        nodig = Math.max(nodig, d);
        break;
      }
      if (d === maximum) nodig = maximum;
    }
  }
  return nodig;
}

/**
 * Het oordeel bij een score, met de norm ernaast.
 *
 * "Kan beter" begint bewust niet op een vaste 50 maar op driekwart van de norm:
 * bij een norm van 80 is 60 "kan beter" en 59 "aandacht nodig". Zo verschuift
 * het oordeel mee als een onderdeel een strengere norm krijgt.
 */
export function standVanScore(score: number | null, norm: number): Stand {
  if (score === null) return "geen";
  if (score >= norm) return "goed";
  if (score >= norm * 0.75) return "beter";
  return "nodig";
}

export const STAND_LABEL: Record<Stand, string> = {
  goed: "Goed",
  beter: "Kan beter",
  nodig: "Aandacht nodig",
  geen: "Niet beoordeeld",
};
