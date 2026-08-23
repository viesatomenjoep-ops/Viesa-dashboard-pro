import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";
import { inclBtw, type Factuur } from "@/lib/facturen";
import { euro } from "@/lib/format";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Debiteuren-agent (#5). Schrijft een concept-betalingsherinnering voor één
 * factuur, met een toon die past bij hoe lang de factuur al openstaat
 * (vriendelijk → formeel → laatste aanmaning). De agent verstuurt NIETS: het is
 * een concept dat de mens nakijkt en zelf verstuurt.
 */

export type HerinneringConcept = {
  onderwerp: string;
  tekst: string;
  toon: string;
  dagenTeLaat: number;
};

function toonAdvies(dagen: number): string {
  if (dagen <= 0) return "vriendelijke vooraankondiging (net verstreken of bijna)";
  if (dagen <= 14) return "vriendelijke eerste herinnering";
  if (dagen <= 30) return "formele tweede herinnering";
  return "laatste aanmaning (formeel, met vervolgstappen)";
}

const SYSTEM = `Je bent de debiteuren-/administratieassistent van ${BEDRIJF.naam}.
Je schrijft Nederlandse betalingsherinneringen: correct, beleefd en zakelijk. Pas de toon aan op hoeveel dagen de factuur te laat is.
Noem het factuurnummer, het openstaande bedrag (incl. btw) en de vervaldatum. Verzin geen bankgegevens of feiten die niet zijn aangeleverd.
Antwoord UITSLUITEND met geldige JSON: {"onderwerp": "...", "tekst": "..."}. De tekst is de complete e-mailtekst inclusief aanhef en afsluiting namens ${BEDRIJF.naam}.`;

export async function genereerHerinnering(
  supabase: SupabaseClient,
  factuurId: string,
): Promise<{ ok: boolean; concept?: HerinneringConcept; fout?: string }> {
  const { data, error } = await supabase
    .from("facturen")
    .select("*")
    .eq("id", factuurId)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Factuur niet gevonden." };
  const f = data as Factuur;

  const dagen = f.vervaldatum
    ? Math.floor((Date.now() - new Date(f.vervaldatum).getTime()) / 86_400_000)
    : 0;
  const toon = toonAdvies(dagen);
  const totaal = inclBtw(f.bedrag, f.btw_percentage);

  const prompt = `Schrijf een betalingsherinnering. Gewenste toon: ${toon}.

Gegevens:
- Klant: ${f.klant ?? "de klant"}
- Factuurnummer: ${f.nummer}
- Bedrag incl. btw: ${euro(totaal)}
- Vervaldatum: ${f.vervaldatum ?? "onbekend"}
- Dagen te laat: ${dagen > 0 ? dagen : "nog niet verstreken / net verstreken"}
- Afzender: ${BEDRIJF.naam}, ${BEDRIJF.email}, ${BEDRIJF.telefoon}

Geef exact: {"onderwerp": "...", "tekst": "..."}`;

  const uitkomst = await draaiAgent<{ onderwerp: string; tekst: string }>({
    supabase,
    agent: "debiteuren",
    system: SYSTEM,
    prompt,
    maxTokens: 900,
    verwachtJson: true,
    invoer: { factuur: f.nummer, dagenTeLaat: dagen },
  });

  if (!uitkomst.ok || !uitkomst.data) {
    return { ok: false, fout: uitkomst.fout ?? "Agent gaf geen resultaat." };
  }
  return {
    ok: true,
    concept: {
      onderwerp: String(uitkomst.data.onderwerp ?? `Betalingsherinnering ${f.nummer}`),
      tekst: String(uitkomst.data.tekst ?? ""),
      toon,
      dagenTeLaat: dagen,
    },
  };
}
