import { PaginaKop } from "@/components/ui/PaginaKop";
import { WebsiteScanner } from "@/components/WebsiteScanner";
import { createClient } from "@/lib/supabase/server";
import { telWeergaven, hoeLangGeleden } from "@/lib/rapport/weergave-telling";

export const dynamic = "force-dynamic";

/**
 * Websitescanner. Losstaand van /audit: die vraagt om een niche en gaat over
 * zichtbaarheid alleen; deze pagina begint bij de site zelf en telt drie
 * oordelen samen tot één cijfer dat je aan een prospect kunt laten zien.
 *
 * De URL kan met de hand getypt worden, maar meestal wil je gewoon een
 * bestaande lead scannen — daarom halen we hier vast de leads met een
 * ingevulde website op, zodat de scanner ze als kieslijst kan aanbieden.
 */
export default async function ScanPagina({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const supabase = createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, bedrijf, website, branche")
    .not("website", "is", null)
    .neq("website", "")
    .order("bedrijf", { ascending: true });

  const { data: scans } = await supabase
    .from("website_scans")
    .select("id, url, host, niche, totaal_score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // Hoe vaak de klantrapporten geopend zijn. Best effort: de tabel bestaat pas
  // na migratie 0049, en de scanpagina hoort daar niet op te wachten.
  let weergaven = new Map<string, { aantal: number; laatst: string }>();
  try {
    const { data } = await supabase
      .from("rapport_weergaven")
      .select("scan_id, bekeken_op")
      .order("bekeken_op", { ascending: false })
      .limit(2000);
    const geteld = telWeergaven(data ?? []);
    weergaven = new Map(
      Array.from(geteld.values()).map((w) => [
        w.scanId,
        { aantal: w.aantal, laatst: hoeLangGeleden(w.laatst) },
      ]),
    );
  } catch {
    /* rapport_weergaven nog niet aanwezig */
  }

  const scansMetWeergaven = (scans ?? []).map((s) => ({
    ...s,
    weergaven: weergaven.get(s.id) ?? null,
  }));

  return (
    <>
      <PaginaKop
        titel="Websitescan"
        omschrijving="Plak een URL en zie in één oordeel hoe zichtbaar dit bedrijf is voor AI-modellen — en wat eraan te doen is."
      />
      <WebsiteScanner
        beginUrl={searchParams.url ?? ""}
        leads={leads ?? []}
        opgeslagenScans={scansMetWeergaven}
      />
    </>
  );
}
