import type { ScanRapport } from "@/lib/scan";
import type { Bevinding } from "@/lib/geo-analyse";

/**
 * De stappenlijst van de scanner: welke controles er zijn, en hoe een bewaarde
 * scan daar weer in terugkomt.
 *
 * Waarom dit een eigen bestand is en niet gewoon in de component staat: het gíng
 * hier mis. `STAPPEN` kreeg er een stap bij (`technologie`), maar de functie die
 * een bewaarde scan terugzet vulde nog de oude acht sleutels. De weergave las
 * daarna `st.status` van niets, en de hele pagina klapte eruit zodra je een
 * eerdere scan opende — met alleen "undefined is not an object" als aanwijzing.
 *
 * Dat is precies het soort fout dat een typecontrole niet vangt (`Record<string,
 * …>` accepteert elke sleutelverzameling) en een mens over het hoofd ziet. Als
 * pure functie is hij wél te testen, en dat doet `scripts/test-scan-stappen.mjs`:
 * die eist dat elke stap uit `STAPPEN` een staat krijgt.
 *
 * Puur, dus geen React en geen `server-only` — anders is hij niet te testen.
 */

export type StapStatus = "wachtend" | "bezig" | "goed" | "aandacht";

export type StapState = {
  status: StapStatus;
  samenvatting: string;
  data?: unknown;
};

/**
 * De sleutels van alle stappen, in de volgorde waarin ze op het scherm staan.
 *
 * Alleen de sleutels: het label en het icoon horen bij de weergave en staan in
 * de component. Zo kan deze module zonder React getest worden.
 */
export const STAP_SLEUTELS = [
  "ophalen",
  "vindbaarheid",
  "structured_data",
  "content",
  "beveiliging",
  "scripts",
  "technologie",
  "snelheid",
  "zichtbaarheid",
] as const;

export type StapSleutel = (typeof STAP_SLEUTELS)[number];

/** Alle stappen op "wachtend" — de staat vóór een scan begint. */
export function beginStappen(): Record<string, StapState> {
  return Object.fromEntries(
    STAP_SLEUTELS.map((k) => [k, { status: "wachtend" as StapStatus, samenvatting: "" }]),
  );
}

/**
 * Bouwt de stappenlijst na uit een bewaard rapport, zodat een eerdere scan
 * teruggezet kan worden zonder hem opnieuw te draaien (en dus zonder opnieuw de
 * vier modellen te bevragen).
 *
 * Begint bij `beginStappen()` en overschrijft van daaruit. Dat is het hele
 * verschil met de oude opzet: een stap die hier niet aan bod komt blijft
 * "wachtend" in plaats van te ontbreken.
 */
export function stappenVanRapport(r: ScanRapport): Record<string, StapState> {
  const vindbaarheid = r.vindbaarheid as { bevindingen?: Bevinding[] } | undefined;
  const beveiliging = r.beveiliging as { percentage?: number } | undefined;

  const technologieAantal = (r.technologie ?? []).reduce((som, g) => som + g.namen.length, 0);

  return {
    ...beginStappen(),

    ophalen: { status: "goed", samenvatting: "" },

    vindbaarheid: {
      status: (vindbaarheid?.bevindingen?.every((b) => b.goed) ?? true) ? "goed" : "aandacht",
      samenvatting: "",
      data: r.vindbaarheid,
    },

    structured_data: {
      status: r.geo.score >= 70 ? "goed" : "aandacht",
      samenvatting: `${r.geo.score}/100`,
      data: r.geo,
    },

    content: { status: "goed", samenvatting: "" },

    beveiliging: {
      status: (beveiliging?.percentage ?? 100) >= 70 ? "goed" : "aandacht",
      samenvatting: "",
      data: r.beveiliging,
    },

    scripts: { status: "goed", samenvatting: "", data: r.scripts },

    technologie: {
      status: "goed",
      samenvatting: technologieAantal === 0 ? "Niets herkend" : `${technologieAantal} herkend`,
      data: r.technologie,
    },

    snelheid: {
      status: (r.techniek.score ?? 0) >= 70 ? "goed" : "aandacht",
      samenvatting:
        r.techniek.score !== null
          ? `${r.techniek.score}/100`
          : (r.techniek.fout ?? "Niet gemeten"),
      data: r.techniek,
    },

    zichtbaarheid: {
      status: r.zichtbaarheid.score !== null && r.zichtbaarheid.score >= 50 ? "goed" : "aandacht",
      samenvatting:
        r.zichtbaarheid.getest > 0
          ? `${r.zichtbaarheid.gevonden} van ${r.zichtbaarheid.getest} modellen noemt dit bedrijf`
          : "Geen niche gemeten",
      data: r.zichtbaarheid.resultaten,
    },
  };
}
