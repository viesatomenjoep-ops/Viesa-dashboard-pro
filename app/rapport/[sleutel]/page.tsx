import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Rapport } from "@/components/rapport/Rapport";
import { rapportVanScan } from "@/lib/rapport/vanScan";
import type { ScanRapport } from "@/lib/scan";

/**
 * Het klantrapport op een eigen, deelbaar adres.
 *
 * Staat bewust buiten de route-group `(app)`: dit is de enige pagina van het
 * dashboard die een buitenstaander te zien krijgt, dus zonder navigatie,
 * zonder zijbalk, en zonder login. De toegang loopt via de deelsleutel in de
 * URL; de RLS-policy uit migratie 0048 staat anoniem lezen alleen toe op rijen
 * die daadwerkelijk gedeeld zijn.
 *
 * Een onbekende of ingetrokken sleutel geeft een gewone 404 — geen melding
 * waaruit valt af te leiden of de sleutel ooit bestaan heeft.
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
    title: data?.host ? `Deep Scan — ${data.host}` : "Deep Scan",
    // Een rapport over de site van een klant hoort niet in een zoekmachine.
    robots: { index: false, follow: false },
  };
}

export default async function GedeeldRapport({ params }: { params: { sleutel: string } }) {
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

  return (
    <Rapport
      rapport={rapport}
      korteUrl={`/rapport/${params.sleutel}/kort`}
      voorstelUrl={`/rapport/${params.sleutel}/voorstel`}
    />
  );
}
