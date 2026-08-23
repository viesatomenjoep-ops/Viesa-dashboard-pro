import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";
import { euro } from "@/lib/format";

/**
 * Dagbriefing-agent (#6). Verzamelt de actiepunten van vandaag (openstaande
 * follow-ups, hete leads, vervallen facturen, agenda, open taken) en laat Claude
 * er één beknopte, geprioriteerde ochtendbriefing van schrijven. Read-only: de
 * agent verandert niets, hij vat samen en adviseert.
 */

const TAAK_WIE: Record<string, string> = { tom: "Tom", joep: "Joep", algemeen: "Team Viesa" };

export type BriefingContext = {
  followups: { bedrijf: string; titel: string; datum: string | null }[];
  heteLeads: { bedrijf: string; score: number; status: string; waarde: number }[];
  vervallenFacturen: { nummer: string; klant: string; bedrag: number; vervaldatum: string | null; dagenTeLaat: number }[];
  agendaVandaag: { titel: string; tijd: string; locatie: string | null }[];
  openTaken: { titel: string; wie: string; deadline: string | null }[];
};

export async function verzamelBriefingContext(
  supabase: SupabaseClient,
): Promise<BriefingContext> {
  const nu = new Date();
  const vandaag = nu.toISOString().slice(0, 10);
  const dagStart = new Date(vandaag + "T00:00:00").toISOString();
  const dagEind = new Date(vandaag + "T23:59:59").toISOString();

  const [fuRes, leadRes, factRes, agRes, taakRes] = await Promise.all([
    supabase
      .from("activiteiten")
      .select("titel, follow_up_datum, lead_id")
      .eq("type", "follow_up")
      .eq("status", "open")
      .lte("follow_up_datum", vandaag)
      .limit(25),
    supabase
      .from("leads")
      .select("bedrijf, score, status, verwachte_waarde")
      .neq("status", "gewonnen")
      .order("score", { ascending: false })
      .limit(6),
    supabase
      .from("facturen")
      .select("nummer, klant, bedrag, vervaldatum, status")
      .in("status", ["open", "vervallen"])
      .lt("vervaldatum", vandaag)
      .limit(25),
    supabase
      .from("agenda_activiteiten")
      .select("titel, begin_ts, locatie, hele_dag")
      .gte("begin_ts", dagStart)
      .lte("begin_ts", dagEind)
      .order("begin_ts", { ascending: true })
      .limit(25),
    supabase
      .from("taken")
      .select("titel, wie, deadline, status")
      .neq("status", "klaar")
      .limit(40),
  ]);

  // Bedrijfsnamen bij de follow-up-leads ophalen.
  const leadIds = Array.from(
    new Set((fuRes.data ?? []).map((f) => f.lead_id).filter(Boolean)),
  ) as string[];
  const bedrijfPer = new Map<string, string>();
  if (leadIds.length) {
    const { data } = await supabase.from("leads").select("id, bedrijf").in("id", leadIds);
    (data ?? []).forEach((l: { id: string; bedrijf: string | null }) =>
      bedrijfPer.set(l.id, l.bedrijf ?? ""),
    );
  }

  return {
    followups: (fuRes.data ?? []).map((f) => ({
      bedrijf: (f.lead_id && bedrijfPer.get(f.lead_id)) || "Onbekend",
      titel: f.titel ?? "Follow-up",
      datum: f.follow_up_datum ?? null,
    })),
    heteLeads: (leadRes.data ?? []).map((l) => ({
      bedrijf: l.bedrijf ?? "",
      score: l.score ?? 0,
      status: l.status ?? "",
      waarde: Number(l.verwachte_waarde || 0),
    })),
    vervallenFacturen: (factRes.data ?? []).map((f) => {
      const dagen = f.vervaldatum
        ? Math.max(0, Math.floor((Date.now() - new Date(f.vervaldatum).getTime()) / 86_400_000))
        : 0;
      return {
        nummer: f.nummer ?? "",
        klant: f.klant ?? "",
        bedrag: Number(f.bedrag || 0),
        vervaldatum: f.vervaldatum ?? null,
        dagenTeLaat: dagen,
      };
    }),
    agendaVandaag: (agRes.data ?? []).map((a) => ({
      titel: a.titel ?? "",
      tijd: a.hele_dag
        ? "hele dag"
        : new Date(a.begin_ts).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
      locatie: a.locatie ?? null,
    })),
    openTaken: (taakRes.data ?? []).map((t) => ({
      titel: t.titel ?? "",
      wie: TAAK_WIE[t.wie] ?? t.wie ?? "",
      deadline: t.deadline ?? null,
    })),
  };
}

/** Aantal concrete actiepunten (voor de "rustige dag"-check en de titel). */
export function briefingTotaal(c: BriefingContext): number {
  return (
    c.followups.length +
    c.vervallenFacturen.length +
    c.agendaVandaag.length +
    c.openTaken.length
  );
}

const SYSTEM = `Je bent de persoonlijke sales- en office-assistent van Viesa Automations (Nederlands IT/automatiseringsbureau; team Tom en Joep).
Schrijf een korte, energieke ochtendbriefing in het Nederlands. Wees concreet en prioriteer: begin met wat vandaag écht belangrijk is (vervallen facturen, follow-ups die vandaag moeten, afspraken), daarna kansen (hete leads) en dan de rest.
Gebruik korte kopjes en bullets. Geen verzonnen feiten — gebruik alleen de aangeleverde data. Max ~200 woorden. Sluit af met één motiverende zin.`;

export async function genereerDagbriefing(supabase: SupabaseClient): Promise<{
  ok: boolean;
  titel: string;
  briefing: string;
  aantal: number;
  fout?: string;
}> {
  const context = await verzamelBriefingContext(supabase);
  const aantal = briefingTotaal(context);
  const datum = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (aantal === 0 && context.heteLeads.length === 0) {
    return {
      ok: true,
      titel: `Ochtendbriefing — ${datum}`,
      briefing: "Rustige start vandaag: geen openstaande follow-ups, vervallen facturen of afspraken. Mooi moment om proactief leads te bellen. 🌤️",
      aantal: 0,
    };
  }

  const prompt = `Datum: ${datum}. Hier is de data voor de ochtendbriefing (JSON):

${JSON.stringify(
    {
      openstaande_followups: context.followups,
      hete_leads: context.heteLeads.map((l) => ({ ...l, waarde: euro(l.waarde) })),
      vervallen_facturen: context.vervallenFacturen.map((f) => ({ ...f, bedrag: euro(f.bedrag) })),
      agenda_vandaag: context.agendaVandaag,
      open_taken: context.openTaken,
    },
    null,
    2,
  )}

Schrijf de ochtendbriefing.`;

  const uitkomst = await draaiAgent<string>({
    supabase,
    agent: "dagbriefing",
    system: SYSTEM,
    prompt,
    maxTokens: 900,
    invoer: { aantal },
  });

  if (!uitkomst.ok) {
    return { ok: false, titel: `Ochtendbriefing — ${datum}`, briefing: "", aantal, fout: uitkomst.fout };
  }
  return { ok: true, titel: `Ochtendbriefing — ${datum}`, briefing: uitkomst.tekst, aantal };
}
