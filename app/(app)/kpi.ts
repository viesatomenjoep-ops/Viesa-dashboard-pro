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

  // Omzet per maand (view) → laatste 6 maanden.
  const omzetRijen = await veilig(
    async () => {
      const { data, error } = await supabase
        .from("omzet_per_maand")
        .select("maand, omzet");
      if (error) throw error;
      return (data ?? []) as { maand: string; omzet: number }[];
    },
    [],
    mark,
  );
  const omzetPerKey = new Map(
    omzetRijen.map((r) => [maandKey(new Date(r.maand)), Number(r.omzet ?? 0)]),
  );
  const omzetGrafiek: Staaf[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
    const key = maandKey(d);
    omzetGrafiek.push({
      label: d.toLocaleDateString("nl-NL", { month: "short" }),
      waarde: omzetPerKey.get(key) ?? 0,
      actief: key === huidigeKey,
    });
  }
  const omzetMaand = omzetPerKey.get(huidigeKey) ?? 0;

  const openstaandBedrag = await veilig(
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
  );

  const { pipelineWaarde, recenteLeads } = await veilig(
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
    { pipelineWaarde: 0, recenteLeads: [] as Lead[] },
    mark,
  );

  const lopendeOffertes = await veilig(
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
  );

  const vandaag = nu.toISOString().slice(0, 10);
  const followups = await veilig(
    async () => {
      const { data, error } = await supabase
        .from("activiteiten")
        .select("id, titel, lead_id, leads(bedrijf)")
        .eq("status", "open")
        .eq("follow_up_datum", vandaag);
      if (error) throw error;
      return (data ?? []).map((r) => {
        const rec = r as { id: string; titel: string | null; lead_id: string | null; leads?: { bedrijf?: string } | null };
        return {
          id: rec.id,
          titel: rec.titel,
          lead_id: rec.lead_id,
          bedrijf: rec.leads?.bedrijf ?? null,
        };
      }) as FollowupVandaag[];
    },
    [],
    mark,
  );

  const recenteActiviteiten = await veilig(
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
  );

  return {
    omzetMaand,
    openstaandBedrag,
    pipelineWaarde,
    lopendeOffertes,
    omzetGrafiek,
    followups,
    recenteLeads,
    recenteActiviteiten,
    schemaOntbreekt,
  };
}
