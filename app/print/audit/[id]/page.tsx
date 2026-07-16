import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Briefpapier } from "@/components/document/Briefpapier";
import { PrintKnop } from "@/components/document/PrintKnop";
import { Markdown } from "@/components/ui/Markdown";
import { datumKort } from "@/lib/format";
import { contextVanKlant, vulVariabelen } from "@/lib/variabelen";
import type { Audit } from "@/lib/audits";

export default async function AuditPrint({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*, klanten(bedrijf)")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const audit = data as Audit & { klanten?: { bedrijf?: string } | null };
  const ctx = contextVanKlant({ bedrijf: audit.klanten?.bedrijf ?? null });

  return (
    <div className="min-h-screen bg-achtergrond py-6">
      <PrintKnop />
      <div className="mx-auto w-fit shadow-lg">
        <Briefpapier
          documenttitel="Auditverslag"
          documentnummer={audit.nummer}
          klant={audit.klanten?.bedrijf ?? null}
          datumRegel={`Datum: ${datumKort(audit.created_at)}`}
        >
          <h2 className="text-lg font-semibold text-navy">{audit.titel}</h2>
          <div className="mt-4">
            {audit.inhoud_html ? (
              <div
                className="prose-viesa"
                dangerouslySetInnerHTML={{ __html: vulVariabelen(audit.inhoud_html, ctx) }}
              />
            ) : audit.inhoud_markdown ? (
              <Markdown tekst={audit.inhoud_markdown} />
            ) : (
              <p className="text-sm text-navy/50">Nog geen inhoud ingevuld.</p>
            )}
          </div>
        </Briefpapier>
      </div>
    </div>
  );
}
