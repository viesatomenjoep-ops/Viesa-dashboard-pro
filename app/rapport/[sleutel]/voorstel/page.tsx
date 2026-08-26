import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { legWeergaveVast } from "@/lib/rapport/weergave";
import { Voorstel } from "@/components/rapport/Voorstel";

/**
 * Het voorstel bij een gedeelde scan: wat Viesa aanbiedt, in de huisstijl van
 * het rapport en op hetzelfde deelbare adres met /voorstel erachter.
 *
 * Derde document naast de samenvatting en het volledige rapport. De scan zegt
 * wat er mis is; dit zegt wat wij eraan zouden doen. Ze horen bij elkaar, maar
 * niet in één stuk: wie alleen de meting wil, hoeft geen verkooppraat te lezen.
 *
 * Dezelfde toegangsregel als de andere twee: de deelsleutel in de URL,
 * afgedwongen door de RLS-policy uit migratie 0048.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { sleutel: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("website_scans")
    .select("host")
    .eq("deelsleutel", params.sleutel)
    .maybeSingle();

  return {
    title: data?.host ? `Voorstel — ${data.host}` : "Voorstel",
    robots: { index: false, follow: false },
  };
}

export default async function VoorstelBijScan({ params }: { params: { sleutel: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("website_scans")
    .select("id, host, bedrijf, totaal_score")
    .eq("deelsleutel", params.sleutel)
    .maybeSingle();

  if (error || !data) notFound();

  // Vastleggen dat dit document geopend is — het sterkste belsignaal dat we
  // hebben. Niet awaiten: de bezoeker wacht op zijn rapport, niet op onze
  // administratie (zie lib/rapport/weergave.ts).
  void legWeergaveVast(data.id as string, "voorstel");

  return (
    <Voorstel
      bedrijf={(data.bedrijf as string | null) ?? null}
      host={(data.host as string | null) ?? null}
      score={(data.totaal_score as number | null) ?? null}
      rapportUrl={`/rapport/${params.sleutel}`}
      korteUrl={`/rapport/${params.sleutel}/kort`}
    />
  );
}
