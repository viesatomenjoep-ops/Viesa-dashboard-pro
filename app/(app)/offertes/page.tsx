import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
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
  let schemaOntbreekt = false;
  try {
    const [o, l] = await Promise.all([
      supabase.from("offertes").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, bedrijf").order("bedrijf"),
    ]);
    if (o.error) throw o.error;
    offertes = (o.data ?? []) as Offerte[];
    leads = l.data ?? [];
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
        <KpiKaart label="Totaal" waarde={String(offertes.length)} />
        <KpiKaart label="Lopend" waarde={String(lopend.length)} accent={lopend.length > 0} />
        <KpiKaart label="Geaccepteerd" waarde={String(geaccepteerd.length)} />
        <KpiKaart label="Waarde geaccepteerd" waarde={euro(waardeGeaccepteerd)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form
        action={maakOfferte}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <input
          name="titel"
          required
          placeholder="Titel offerte *"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <select
          name="lead_id"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Geen lead</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.bedrijf}
            </option>
          ))}
        </select>
        <input
          name="klant"
          placeholder="Klant"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="bedrag"
          type="number"
          step="0.01"
          placeholder="Bedrag"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Nieuw
        </button>
      </form>

      {schemaOntbreekt ? (
        <SchemaMelding />
      ) : offertes.length === 0 ? (
        <LegeStaat titel="Nog geen offertes" omschrijving="Maak je eerste offerte hierboven aan." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Titel</th>
                <th className="px-5 py-3 font-medium">Klant</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Bedrag</th>
                <th className="px-5 py-3 font-medium">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {offertes.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3">
                    <Link href={`/offertes/${o.id}`} className="text-navy hover:underline">
                      {o.nummer}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-navy">{o.titel}</td>
                  <td className="px-5 py-3 text-navy/70">{o.klant ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge toon={offerteStatusToon(o.status)}>
                      {offerteStatusLabel(o.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-navy">{euro(o.bedrag)}</td>
                  <td className="px-5 py-3 text-navy/50">{datumKort(o.created_at)}</td>
                </tr>
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
