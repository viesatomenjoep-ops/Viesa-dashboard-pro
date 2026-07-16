import { WidgetLauncher } from "@/components/WidgetLauncher";
import { InfoWidgets } from "@/components/InfoWidgets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function veilig<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Startscherm (iPhone-home): logo + een scrollbare info-balk (te doen, leads,
 * openstaand, offertes) + het rooster van widget-blokken. De pagina zelf scrollt
 * niet verticaal; alleen de info-balk schuift horizontaal.
 */
export default async function HomePagina() {
  const supabase = createClient();

  const [openTaken, leads, openstaand, offertes] = await Promise.all([
    veilig(async () => {
      const { count } = await supabase
        .from("taken")
        .select("*", { count: "exact", head: true })
        .eq("klaar", false);
      return count ?? 0;
    }, 0),
    veilig(async () => {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      return count ?? 0;
    }, 0),
    veilig(async () => {
      const { data } = await supabase
        .from("facturen")
        .select("bedrag, status")
        .in("status", ["open", "vervallen"]);
      return (data ?? []).reduce((s, f) => s + Number(f.bedrag ?? 0), 0);
    }, 0),
    veilig(async () => {
      const { count } = await supabase
        .from("offertes")
        .select("*", { count: "exact", head: true })
        .in("status", ["concept", "verzonden", "opvolgen"]);
      return count ?? 0;
    }, 0),
  ]);

  return (
    <div className="overflow-hidden">
      <WidgetLauncher
        metKop={false}
        roosterAlleenMobiel
        bovenGrid={
          <InfoWidgets
            openTaken={openTaken}
            leads={leads}
            openstaand={openstaand}
            offertes={offertes}
          />
        }
      />
    </div>
  );
}
