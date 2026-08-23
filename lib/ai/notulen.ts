import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";

/**
 * Notulen-agent (#7). Zet losse gespreks-/vergadernotities (getypt of ingesproken)
 * om in gestructureerde actiepunten: samenvatting, taken, agenda-items en
 * follow-ups. De agent maakt niets aan — de gebruiker kiest wat hij vastlegt.
 */

export type AgendaVoorstel = { titel: string; datum: string | null };
export type NotulenResultaat = {
  samenvatting: string;
  taken: string[];
  agenda: AgendaVoorstel[];
  followups: string[];
};

const SYSTEM = `Je bent de notulen-assistent van Viesa Automations. Je krijgt ruwe notities van een gesprek of vergadering en haalt daar concrete actiepunten uit.
Antwoord UITSLUITEND met geldige JSON. Nederlands, kort en concreet. Verzin geen actiepunten die niet in de notities staan. Gebruik voor datums het formaat JJJJ-MM-DD (of null als er geen datum is).`;

export async function verwerkNotulen(
  supabase: SupabaseClient,
  tekst: string,
): Promise<{ ok: boolean; resultaat?: NotulenResultaat; fout?: string }> {
  const schoon = (tekst ?? "").trim();
  if (schoon.length < 5) return { ok: false, fout: "Geef eerst wat notities in." };

  const vandaag = new Date().toISOString().slice(0, 10);
  const uitkomst = await draaiAgent<NotulenResultaat>({
    supabase,
    agent: "notulen",
    system: SYSTEM,
    prompt: `Datum vandaag: ${vandaag}.
Ruwe notities:
"""${schoon.slice(0, 6000)}"""

Geef exact:
{
  "samenvatting": "<2-4 zinnen>",
  "taken": ["<concrete taak>", "..."],
  "agenda": [{"titel": "<afspraak>", "datum": "JJJJ-MM-DD of null"}],
  "followups": ["<wie/wat opvolgen>", "..."]
}`,
    maxTokens: 1100,
    verwachtJson: true,
    invoer: { lengte: schoon.length },
  });

  if (!uitkomst.ok || !uitkomst.data) return { ok: false, fout: uitkomst.fout ?? "Geen resultaat." };
  const r = uitkomst.data;
  const alsLijst = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
  return {
    ok: true,
    resultaat: {
      samenvatting: String(r.samenvatting ?? ""),
      taken: alsLijst(r.taken),
      followups: alsLijst(r.followups),
      agenda: Array.isArray(r.agenda)
        ? r.agenda
            .filter((a) => a && a.titel)
            .map((a) => ({ titel: String(a.titel), datum: a.datum ? String(a.datum) : null }))
        : [],
    },
  };
}
