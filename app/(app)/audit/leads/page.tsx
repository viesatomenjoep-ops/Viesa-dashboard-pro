import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { LeadDirectory } from "@/components/LeadDirectory";

export const dynamic = "force-dynamic";

/**
 * Lead directory — de gedeelde prospectlijst van de audit-module.
 *
 * Staat los van `/leads`: dat is de eigen pipeline van Viesa met scores,
 * offertes en follow-ups. Deze lijst is het jachtterrein waaruit je audits
 * draait, gevuld door een beheerder (tabel `ai_leads`, migratie 0044).
 */
export default function LeadDirectoryPagina() {
  return (
    <>
      <PaginaKop
        titel="Lead directory"
        omschrijving="Bedrijven om te auditen en te pitchen. Eén klik en de audit staat klaar met URL en niche ingevuld."
        actie={
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            <Sparkles size={16} /> Naar de audit
          </Link>
        }
      />
      <LeadDirectory />
    </>
  );
}
