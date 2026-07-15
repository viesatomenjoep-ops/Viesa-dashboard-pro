import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Briefpapier } from "@/components/document/Briefpapier";
import { PrintKnop } from "@/components/document/PrintKnop";
import { Markdown } from "@/components/ui/Markdown";
import { euro, datumKort } from "@/lib/format";
import type { Offerte } from "@/lib/offertes";

export default async function OffertePrint({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("offertes")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const offerte = data as Offerte;

  return (
    <div className="min-h-screen bg-achtergrond py-6">
      <PrintKnop />
      <div className="mx-auto w-fit shadow-lg">
        <Briefpapier
          documenttitel="Offerte"
          documentnummer={offerte.nummer}
          klant={offerte.klant}
          datumRegel={`Datum: ${datumKort(offerte.created_at)}`}
        >
          <h2 className="text-lg font-semibold text-navy">{offerte.titel}</h2>
          <div className="mt-4">
            {offerte.inhoud_markdown ? (
              <Markdown tekst={offerte.inhoud_markdown} />
            ) : (
              <p className="text-sm text-navy/50">Nog geen inhoud ingevuld.</p>
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <div className="w-64 border-t border-navy/15 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">Totaal</span>
                <span className="font-semibold text-navy">{euro(offerte.bedrag)}</span>
              </div>
            </div>
          </div>
        </Briefpapier>
      </div>
    </div>
  );
}
