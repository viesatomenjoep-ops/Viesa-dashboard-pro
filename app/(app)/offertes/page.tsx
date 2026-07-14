import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { KnopLink } from "@/components/ui/Knop";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  offerteStatusToon,
  OFFERTE_STATUSSEN,
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
  let schemaOntbreekt = false;
  let offertes: Offerte[] = [];
  let klanten: { id: string; bedrijfsnaam: string }[] = [];
  let templates: { id: string; naam: string }[] = [];

  try {
    const [o, k, t] = await Promise.all([
      supabase.from("offertes").select("*").order("created_at", { ascending: false }),
      supabase.from("klanten").select("id, bedrijfsnaam").order("bedrijfsnaam"),
      supabase.from("offerte_templates").select("id, naam").order("naam"),
    ]);
    if (o.error) throw o.error;
    offertes = (o.data ?? []) as Offerte[];
    klanten = k.data ?? [];
    templates = t.data ?? [];
  } catch {
    schemaOntbreekt = true;
  }

  const concept = offertes.filter((o) => o.status === "concept").length;
  const teVolgen = offertes.filter((o) =>
    ["verzonden", "opvolgen"].includes(o.status),
  ).length;
  const geaccepteerd = offertes.filter((o) => o.status === "geaccepteerd");
  const waardeGeaccepteerd = geaccepteerd.reduce(
    (s, o) => s + Number(o.bedrag || 0),
    0,
  );

  return (
    <>
      <PaginaKop
        titel="Offertes"
        omschrijving="Genereer uit een template, volg de status en bewaar de PDF-link."
        actie={
          <KnopLink href="/offertes/templates" variant="secundair">
            Templates
          </KnopLink>
        }
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKaart label="Concept" waarde={String(concept)} />
        <KpiKaart label="Te volgen" waarde={String(teVolgen)} accent={teVolgen > 0} />
        <KpiKaart label="Geaccepteerd" waarde={String(geaccepteerd.length)} />
        <KpiKaart label="Waarde geaccepteerd" waarde={euro(waardeGeaccepteerd)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Nieuwe offerte */}
      <form
        action={maakOfferte}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <input
          name="titel"
          required
          placeholder="Titel offerte *"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <select
          name="klant_id"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Geen klant</option>
          {klanten.map((k) => (
            <option key={k.id} value={k.id}>
              {k.bedrijfsnaam}
            </option>
          ))}
        </select>
        <select
          name="template_id"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Geen template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.naam}
            </option>
          ))}
        </select>
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
        <LegeStaat
          titel="Nog geen offertes"
          omschrijving="Maak je eerste offerte hierboven aan."
        />
      ) : (
        <Kaart className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Titel</th>
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
                  <td className="px-5 py-3">
                    <Badge toon={offerteStatusToon(o.status)}>
                      {OFFERTE_STATUSSEN.find((s) => s.key === o.status)?.label}
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
      <p className="mt-1 text-navy/70">
        Voer de migraties uit in de Supabase SQL Editor.
      </p>
    </div>
  );
}
