import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Samenvatting } from "@/components/rapport/Samenvatting";
import { rapportVanScan } from "@/lib/rapport/vanScan";
import type { ScanRapport } from "@/lib/scan";

/**
 * De korte versie van het klantrapport, op hetzelfde deelbare adres met /kort
 * erachter.
 *
 * Dezelfde meting, andere lezer. Het volledige rapport toont per onderdeel de
 * metingen en het bewijs — dat is wat een ontwikkelaar nodig heeft. Deze versie
 * geeft per onderdeel één kaart met wat er aan de hand is, waarom het uitmaakt
 * en hoe zwaar het weegt, en past afgedrukt op één of twee vellen.
 *
 * Dezelfde toegangsregel als het volledige rapport: de deelsleutel in de URL,
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
    title: data?.host ? `Samenvatting — ${data.host}` : "Samenvatting",
    robots: { index: false, follow: false },
  };
}

export default async function KorteSamenvatting({ params }: { params: { sleutel: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("website_scans")
    .select("rapport, created_at, bedrijf")
    .eq("deelsleutel", params.sleutel)
    .maybeSingle();

  if (error || !data?.rapport) notFound();

  const rapport = rapportVanScan(data.rapport as ScanRapport, {
    bedrijf: (data.bedrijf as string | null) ?? null,
    gemetenOp: data.created_at as string,
  });

  return <Samenvatting rapport={rapport} volledigUrl={`/rapport/${params.sleutel}`} />;
}
