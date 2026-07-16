import { CheckCircle2, Coins, FileStack, FileText, Plus } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { VolScherm } from "@/components/ui/VolScherm";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { RijLink } from "@/components/ui/RijLink";
import { KlantZoeker } from "@/components/KlantZoeker";
import { createClient } from "@/lib/supabase/server";
import {
  offerteStatusToon,
  offerteStatusLabel,
  LOPENDE_OFFERTE_STATUS,
  type Offerte,
} from "@/lib/offertes";
import { euro, datumKort } from "@/lib/format";
import { maakOfferte } from "./acties";

export default async function OffertesPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let offertes: Offerte[] = [];
  let leads: { id: string; bedrijf: string }[] = [];
  let klanten: { id: string; bedrijf: string }[] = [];
  let schemaOntbreekt = false;
  try {
    const [o, l, k] = await Promise.all([
      supabase.from("offertes").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, bedrijf").order("bedrijf"),
      supabase.from("klanten").select("id, bedrijf").order("bedrijf"),
    ]);
    if (o.error) throw o.error;
    offertes = (o.data ?? []) as Offerte[];
    leads = l.data ?? [];
    klanten = k.data ?? [];
  } catch {
    schemaOntbreekt = true;
  }

  const lopend = offertes.filter((o) => LOPENDE_OFFERTE_STATUS.includes(o.status));
  const geaccepteerd = offertes.filter((o) => o.status === "geaccepteerd");
  const waardeGeaccepteerd = geaccepteerd.reduce((s, o) => s + Number(o.bedrag || 0), 0);

  return (
    <>
      <PaginaKop
        titel="Offertes"
        omschrijving="Stel offertes op, volg de status en bewaar de PDF-link."
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKaart label="Totaal" waarde={String(offertes.length)} icoon={FileStack} toon="teal" />
        <StatKaart
          label="Lopend"
          waarde={String(lopend.length)}
          icoon={FileText}
          toon={lopend.length > 0 ? "amber" : "grijs"}
        />
        <StatKaart
          label="Geaccepteerd"
          waarde={String(geaccepteerd.length)}
          icoon={CheckCircle2}
          toon="groen"
        />
        <StatKaart
          label="Waarde geaccepteerd"
          waarde={euro(waardeGeaccepteerd)}
          icoon={Coins}
          toon="blauw"
        />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <div className="mb-8">
        <VolScherm label="Nieuwe offerte aanmaken" titel="Nieuwe offerte" icoon={<Plus size={16} />}>
          <form action={maakOfferte} className="space-y-3">
            <input
              name="titel"
              required
              placeholder="Titel offerte *"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
            <select
              name="lead_id"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            >
              <option value="">Geen lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.bedrijf}
                </option>
              ))}
            </select>
            <KlantZoeker
              klanten={klanten}
              placeholder="Klant zoeken…"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
            <input
              name="bedrag"
              type="number"
              step="0.01"
              placeholder="Bedrag (€)"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Offerte aanmaken
            </button>
          </form>
        </VolScherm>
      </div>

      {schemaOntbreekt ? (
        <SchemaMelding />
      ) : offertes.length === 0 ? (
        <LegeStaat titel="Nog geen offertes" omschrijving="Maak je eerste offerte hierboven aan." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-3 py-3 font-medium sm:px-5">Nummer</th>
                <th className="px-3 py-3 font-medium sm:px-5">Titel</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Klant</th>
                <th className="px-3 py-3 font-medium sm:px-5">Status</th>
                <th className="px-3 py-3 font-medium sm:px-5">Bedrag</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {offertes.map((o) => (
                <RijLink
                  key={o.id}
                  href={`/offertes/${o.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-3 py-3 font-medium text-navy sm:px-5">{o.nummer}</td>
                  <td className="max-w-[36vw] truncate px-3 py-3 text-navy sm:max-w-none sm:px-5">
                    {o.titel}
                  </td>
                  <td className="hidden px-3 py-3 text-navy/70 sm:table-cell sm:px-5">{o.klant ?? "—"}</td>
                  <td className="px-3 py-3 sm:px-5">
                    <Badge toon={offerteStatusToon(o.status)}>
                      {offerteStatusLabel(o.status)}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-navy sm:px-5">{euro(o.bedrag)}</td>
                  <td className="hidden px-3 py-3 text-navy/50 sm:table-cell sm:px-5">{datumKort(o.created_at)}</td>
                </RijLink>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}

function SchemaMelding() {
  return (
    <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
      <p className="font-medium text-oranje">Datamodel nog niet actief</p>
      <p className="mt-1 text-navy/70">Voer 0004 uit in de Supabase SQL Editor.</p>
    </div>
  );
}
