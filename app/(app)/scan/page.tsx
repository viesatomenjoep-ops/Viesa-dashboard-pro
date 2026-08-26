import { PaginaKop } from "@/components/ui/PaginaKop";
import { WebsiteScanner } from "@/components/WebsiteScanner";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <>
      <PaginaKop
        titel="Websitescan"
        omschrijving="Plak een URL en zie in één oordeel hoe zichtbaar dit bedrijf is voor AI-modellen — en wat eraan te doen is."
      />
      <WebsiteScanner beginUrl={searchParams.url ?? ""} leads={leads ?? []} />
    </>
  );
}
