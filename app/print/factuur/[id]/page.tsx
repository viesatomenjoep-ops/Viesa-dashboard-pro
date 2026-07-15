import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Briefpapier } from "@/components/document/Briefpapier";
import { PrintKnop } from "@/components/document/PrintKnop";
import { euro, datumKort } from "@/lib/format";
import { inclBtw, type Factuur } from "@/lib/facturen";

export default async function FactuurPrint({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("facturen")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const f = data as Factuur;

  const btwBedrag = inclBtw(f.bedrag, f.btw_percentage) - f.bedrag;
  const totaal = inclBtw(f.bedrag, f.btw_percentage);

  return (
    <div className="min-h-screen bg-achtergrond py-6">
      <PrintKnop />
      <div className="mx-auto w-fit shadow-lg">
        <Briefpapier
          documenttitel="Factuur"
          documentnummer={f.nummer}
          klant={f.klant}
          datumRegel={`Factuurdatum: ${datumKort(f.factuurdatum)}${
            f.vervaldatum ? ` · Vervaldatum: ${datumKort(f.vervaldatum)}` : ""
          }`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/15 text-left text-navy/50">
                <th className="py-2 font-medium">Omschrijving</th>
                <th className="py-2 text-right font-medium">Bedrag</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-navy/10">
                <td className="py-3 text-navy">
                  Dienstverlening Viesa Automations
                  {f.klant ? ` — ${f.klant}` : ""}
                </td>
                <td className="py-3 text-right text-navy">{euro(f.bedrag)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-navy/60">Subtotaal (excl. btw)</span>
                <span className="text-navy">{euro(f.bedrag)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy/60">Btw {f.btw_percentage}%</span>
                <span className="text-navy">{euro(btwBedrag)}</span>
              </div>
              <div className="flex justify-between border-t border-navy/15 pt-1">
                <span className="font-semibold text-navy">Totaal</span>
                <span className="font-semibold text-navy">{euro(totaal)}</span>
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm text-navy/60">
            Gelieve het totaalbedrag van {euro(totaal)} over te maken onder vermelding
            van factuurnummer {f.nummer}
            {f.vervaldatum ? ` vóór ${datumKort(f.vervaldatum)}` : ""}.
          </p>
        </Briefpapier>
      </div>
    </div>
  );
}
