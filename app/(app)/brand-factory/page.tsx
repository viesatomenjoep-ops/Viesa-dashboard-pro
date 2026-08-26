import { createClient } from "@/lib/supabase/server";
import { BrandFactoryOverzicht } from "./BrandFactoryOverzicht";

export default async function BrandFactoryPage() {
  const supabase = await createClient();

  const { data: merken } = await supabase
    .from("brand_factory_stats")
    .select("*")
    .order("naam");

  const { data: recenteRenders } = await supabase
    .from("ad_renders")
    .select("id, variant, bestand_url, type, gerenderd_op, concept:ad_concepten(key, headline, mechaniek, merk:merken(naam))")
    .order("gerenderd_op", { ascending: false })
    .limit(12);

  const totaalConcepten = merken?.reduce((s, m) => s + (m.concepten || 0), 0) ?? 0;
  const totaalRenders = merken?.reduce((s, m) => s + (m.renders || 0), 0) ?? 0;
  const totaalMerken = merken?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#19445B]">Brand Factory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pixel-perfecte ads zonder tokenkosten — {totaalMerken} merken actief
          </p>
        </div>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Merken", waarde: totaalMerken },
          { label: "Concepten", waarde: totaalConcepten },
          { label: "Renders", waarde: totaalRenders.toLocaleString("nl-NL") },
          { label: "Batches", waarde: merken?.reduce((s, m) => s + (m.batches || 0), 0) ?? 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
            <p className="text-xl font-bold text-[#19445B] sm:text-2xl">{kpi.waarde}</p>
            <p className="text-xs text-gray-500 sm:text-sm">{kpi.label}</p>
          </div>
        ))}
      </div>

      <BrandFactoryOverzicht merken={merken || []} recenteRenders={recenteRenders || []} />
    </div>
  );
}
