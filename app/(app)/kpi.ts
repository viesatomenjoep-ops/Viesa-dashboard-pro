import { createClient } from "@/lib/supabase/server";
import type { Staaf } from "@/components/ui/StaafGrafiek";
import type { Lead } from "@/lib/leads";
import type { Activiteit } from "@/lib/activiteiten";

export type FollowupVandaag = {
  id: string;
  titel: string | null;
  lead_id: string | null;
  bedrijf: string | null;
};

export type DashboardData = {
  omzetMaand: number;
  openstaandBedrag: number;
  pipelineWaarde: number;
  lopendeOffertes: number;
  omzetGrafiek: Staaf[];
  followups: FollowupVandaag[];
  recenteLeads: Lead[];
  recenteActiviteiten: (Activiteit & { bedrijf: string | null })[];
  schemaOntbreekt: boolean;
};

async function veilig<T>(fn: () => Promise<T>, fallback: T, mark: () => void): Promise<T> {
  try {
    return await fn();
  } catch {
    mark();
    return fallback;
  }
}

function maandKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function haalDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  let schemaOntbreekt = false;
  const mark = () => {
    schemaOntbreekt = true;
  };

  const nu = new Date();
  const huidigeKey = maandKey(nu);
  const vandaag = nu.toISOString().slice(0, 10);

  // Alle onafhankelijke queries TEGELIJK (i.p.v. na elkaar) — scheelt veel tijd.
  const [
    omzetRijen,
    openstaandBedrag,
    leadInfo,
    lopendeOffertes,
    followups,
    recenteActiviteiten,
  ] = await Promise.all([
    veilig<{ maand: string; omzet: number }[]>(
      async () => {
        const { data, error } = await supabase.from("omzet_per_maand").select("maand, omzet");
        if (error) throw error;
        return (data ?? []) as { maand: string; omzet: number }[];
      },
      [],
      mark,
    ),
    veilig<number>(
      async () => {
        const { data, error } = await supabase
          .from("facturen")
          .select("bedrag, status")
          .in("status", ["open", "vervallen"]);
        if (error) throw error;
        return (data ?? []).reduce((s, f) => s + Number(f.bedrag ?? 0), 0);
      },
      0,
      mark,
    ),
    veilig<{ pipelineWaarde: number; recenteLeads: Lead[] }>(
      async () => {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const leads = (data ?? []) as Lead[];
        return {
          pipelineWaarde: leads
            .filter((l) => l.status !== "gewonnen")
            .reduce((s, l) => s + Number(l.verwachte_waarde ?? 0), 0),
          recenteLeads: leads.slice(0, 5),
        };
      },
      { pipelineWaarde: 0, recenteLeads: [] },
      mark,
    ),
    veilig<number>(
      async () => {
        const { count, error } = await supabase
          .from("offertes")
          .select("*", { count: "exact", head: true })
          .in("status", ["concept", "verzonden", "opvolgen"]);
        if (error) throw error;
        return count ?? 0;
      },
      0,
      mark,
    ),
    veilig<FollowupVandaag[]>(
      async () => {
        const { data, error } = await supabase
          .from("activiteiten")
          .select("id, titel, lead_id, leads(bedrijf)")
          .eq("status", "open")
          .eq("follow_up_datum", vandaag);
        if (error) throw error;
        return (data ?? []).map((r) => {
          const rec = r as {
            id: string;
            titel: string | null;
            lead_id: string | null;
            leads?: { bedrijf?: string } | null;
          };
          return {
            id: rec.id,
            titel: rec.titel,
            lead_id: rec.lead_id,
            bedrijf: rec.leads?.bedrijf ?? null,
          };
        });
      },
      [],
      mark,
    ),
    veilig<(Activiteit & { bedrijf: string | null })[]>(
      async () => {
        const { data, error } = await supabase
          .from("activiteiten")
          .select("*, leads(bedrijf)")
          .order("created_at", { ascending: false })
          .limit(8);
        if (error) throw error;
        return (data ?? []).map((r) => {
          const rec = r as Activiteit & { leads?: { bedrijf?: string } | null };
          return { ...rec, bedrijf: rec.leads?.bedrijf ?? null };
        });
      },
      [],
      mark,
    ),
  ]);

  const omzetPerKey = new Map(
    omzetRijen.map((r) => [maandKey(new Date(r.maand)), Number(r.omzet ?? 0)]),
  );
  const omzetGrafiek: Staaf[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
    const key = maandKey(d);
    omzetGrafiek.push({
      label: d.toLocaleDateString("nl-NL", { month: "short" }),
      waarde: omzetPerKey.get(key) ?? 0,
      actief: key === huidigeKey,
    });
  }

  return {
    omzetMaand: omzetPerKey.get(huidigeKey) ?? 0,
    openstaandBedrag,
    pipelineWaarde: leadInfo.pipelineWaarde,
    lopendeOffertes,
    omzetGrafiek,
    followups,
    recenteLeads: leadInfo.recenteLeads,
    recenteActiviteiten,
    schemaOntbreekt,
  };
}
