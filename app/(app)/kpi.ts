import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
  omzetMaand: number;
  openstaandBedrag: number;
  actieveDeals: number;
  nieuweLeads: number;
  followupsVandaag: {
    id: string;
    titel: string;
    vervaldatum: string | null;
  }[];
  /** True als het datamodel nog niet is toegepast (tabellen ontbreken). */
  schemaOntbreekt: boolean;
};

/** Voert een query uit en geeft een fallback terug als de tabel nog niet bestaat. */
async function veilig<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError: () => void,
): Promise<T> {
  try {
    return await fn();
  } catch {
    onError();
    return fallback;
  }
}

export async function haalDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  let schemaOntbreekt = false;
  const markeer = () => {
    schemaOntbreekt = true;
  };

  const nu = new Date();
  const beginMaand = new Date(nu.getFullYear(), nu.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const zevenDagenGeleden = new Date(nu.getTime() - 7 * 864e5).toISOString();

  const omzetMaand = await veilig(
    async () => {
      const { data, error } = await supabase
        .from("omzet_per_maand")
        .select("maand, omzet")
        .gte("maand", beginMaand);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.omzet ?? 0), 0);
    },
    0,
    markeer,
  );

  const openstaandBedrag = await veilig(
    async () => {
      const { data, error } = await supabase
        .from("openstaande_facturen")
        .select("bedrag")
        .single();
      if (error) throw error;
      return Number(data?.bedrag ?? 0);
    },
    0,
    markeer,
  );

  const actieveDeals = await veilig(
    async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("stage", ["gekwalificeerd", "contact", "offerte"]);
      if (error) throw error;
      return count ?? 0;
    },
    0,
    markeer,
  );

  const nieuweLeads = await veilig(
    async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", zevenDagenGeleden);
      if (error) throw error;
      return count ?? 0;
    },
    0,
    markeer,
  );

  const followupsVandaag = await veilig(
    async () => {
      const { data, error } = await supabase
        .from("followups_vandaag")
        .select("id, titel, vervaldatum")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as DashboardData["followupsVandaag"];
    },
    [],
    markeer,
  );

  return {
    omzetMaand,
    openstaandBedrag,
    actieveDeals,
    nieuweLeads,
    followupsVandaag,
    schemaOntbreekt,
  };
}
