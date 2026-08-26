import { Suspense } from "react";
import Link from "next/link";
import { ClipboardCheck, Users } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { VisibilityAuditView } from "@/components/VisibilityAuditView";
import { GeoContentEditor } from "@/components/GeoContentEditor";

export const dynamic = "force-dynamic";

/**
 * AI Visibility Audit.
 *
 * Twee delen onder elkaar, in de volgorde van het verkoopgesprek: eerst de
 * audit die het probleem aantoont, daaronder de GEO-generator die het oplost.
 * Dat tweede deel is pas relevant als de prospect klant is geworden, maar het
 * staat er bewust bij — zo zie je tijdens de pitch al wat je levert.
 */
export default function AuditPagina({
  searchParams,
}: {
  searchParams: { url?: string; niche?: string };
}) {
  return (
    <>
      <PaginaKop
        titel="AI Visibility Audit"
        omschrijving="Word je aanbevolen wanneer een klant het aan ChatGPT, Claude, Gemini of Perplexity vraagt?"
        actie={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/audits"
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              <ClipboardCheck size={16} /> Auditverslagen (PDF)
            </Link>
            <Link
              href="/audit/leads"
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              <Users size={16} /> Lead directory
            </Link>
          </div>
        }
      />

      {/* useSearchParams vereist een Suspense-grens in de App Router. */}
      <Suspense fallback={<p className="text-sm text-navy/40">Laden…</p>}>
        <VisibilityAuditView />
      </Suspense>

      <div className="mt-12 border-t border-navy/10 pt-8">
        <GeoContentEditor
          beginUrl={searchParams.url ?? ""}
          beginNiche={searchParams.niche ?? ""}
        />
      </div>
    </>
  );
}
