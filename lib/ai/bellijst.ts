import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";

/**
 * Bel-lijst-agent (#1). Bekijkt de actieve leads en stelt voor wie we vandaag
 * het beste kunnen bellen: op basis van score, verwachte waarde, status en hoe
 * lang geleden er contact was. Levert per lead een reden + 3 gesprekspunten en
 * een prioriteit. De agent SCHRIJFT NIETS — de gebruiker zet suggesties zelf op
 * de bellijst (bevestiging).
 */

export type BelSuggestie = {
  lead_id: string;
  bedrijf: string;
  prioriteit: "hoog" | "middel" | "laag";
  reden: string;
  gesprekspunten: string[];
};

type LeadRij = {
  id: string;
  bedrijf: string | null;
  plaats: string | null;
  status: string | null;
  score: number | null;
  verwachte_waarde: number | null;
  contact_naam: string | null;
  telefoon: string | null;
  telefoon_contact: string | null;
  branche: string | null;
  it_aanbod: string | null;
  notities: string | null;
  laatst_gebeld: string | null;
  updated_at: string | null;
};

const SYSTEM = `Je bent de sales-assistent van Viesa Automations, een Nederlands automatiserings- en IT-bureau.
Je helpt het salesteam (Tom en Joep) bepalen wie ze vandaag moeten bellen.
Kies uit de aangeleverde leads de meest kansrijke om NU te bellen: weeg hoge score, hoge verwachte waarde,
gevorderde pipelinestatus en 'lang geleden contact' zwaar mee. Sla leads zonder telefoonnummer over.
Antwoord UITSLUITEND met geldige JSON, geen uitleg eromheen. Alle tekst in het Nederlands, kort en concreet.`;

function promptVoor(leads: LeadRij[], maxAantal: number): string {
  const vandaag = new Date().toISOString().slice(0, 10);
  const rijen = leads.map((l) => ({
    lead_id: l.id,
    bedrijf: l.bedrijf ?? "",
    plaats: l.plaats ?? "",
    status: l.status ?? "",
    score: l.score ?? 0,
    verwachte_waarde: l.verwachte_waarde ?? 0,
    contact: l.contact_naam ?? "",
    heeft_telefoon: Boolean(l.telefoon || l.telefoon_contact),
    branche: l.branche ?? "",
    aanbod: l.it_aanbod ?? "",
    laatst_gebeld: l.laatst_gebeld ?? "nooit",
    notitie: (l.notities ?? "").slice(0, 240),
  }));

  return `Datum: ${vandaag}.
Hieronder de actieve leads (JSON). Kies de beste ${maxAantal} om vandaag te bellen.

${JSON.stringify(rijen, null, 2)}

Geef exact dit JSON-formaat terug:
{
  "suggesties": [
    {
      "lead_id": "<exact het lead_id uit de invoer>",
      "bedrijf": "<bedrijfsnaam>",
      "prioriteit": "hoog" | "middel" | "laag",
      "reden": "<1 zin waarom nú bellen>",
      "gesprekspunten": ["<punt 1>", "<punt 2>", "<punt 3>"]
    }
  ]
}
Regels: gebruik alleen lead_id's die in de invoer staan; sla leads zonder telefoon over;
sorteer op prioriteit (hoog eerst); maximaal ${maxAantal} suggesties; precies 3 gesprekspunten per lead.`;
}

export async function genereerBellijst(
  supabase: SupabaseClient,
  maxAantal = 8,
): Promise<{ ok: boolean; suggesties: BelSuggestie[]; fout?: string }> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, bedrijf, plaats, status, score, verwachte_waarde, contact_naam, telefoon, telefoon_contact, branche, it_aanbod, notities, laatst_gebeld, updated_at",
    )
    .neq("status", "gewonnen")
    .order("score", { ascending: false })
    .limit(60);

  if (error) return { ok: false, suggesties: [], fout: error.message };
  const leads = (data ?? []) as LeadRij[];
  const belbaar = leads.filter((l) => l.telefoon || l.telefoon_contact);
  if (belbaar.length === 0) {
    return { ok: true, suggesties: [] };
  }

  const uitkomst = await draaiAgent<{ suggesties: BelSuggestie[] }>({
    supabase,
    agent: "bellijst",
    system: SYSTEM,
    prompt: promptVoor(belbaar, maxAantal),
    maxTokens: 2000,
    verwachtJson: true,
    invoer: { aantal_leads: belbaar.length, max: maxAantal },
  });

  if (!uitkomst.ok || !uitkomst.data) {
    return { ok: false, suggesties: [], fout: uitkomst.fout ?? "Agent gaf geen resultaat." };
  }

  // Alleen bekende lead_id's toelaten (geen verzonnen id's).
  const bekend = new Map(belbaar.map((l) => [l.id, l.bedrijf ?? ""]));
  const schoon = (uitkomst.data.suggesties ?? [])
    .filter((s) => s && bekend.has(s.lead_id))
    .map((s) => ({
      lead_id: s.lead_id,
      bedrijf: s.bedrijf || bekend.get(s.lead_id) || "",
      prioriteit: (["hoog", "middel", "laag"].includes(s.prioriteit)
        ? s.prioriteit
        : "middel") as BelSuggestie["prioriteit"],
      reden: String(s.reden ?? "").slice(0, 240),
      gesprekspunten: Array.isArray(s.gesprekspunten)
        ? s.gesprekspunten.slice(0, 3).map((g) => String(g))
        : [],
    }));

  return { ok: true, suggesties: schoon };
}
