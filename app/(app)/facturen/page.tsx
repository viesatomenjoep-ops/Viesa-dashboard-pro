import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  factuurStatusToon,
  FACTUUR_STATUSSEN,
  type Factuur,
} from "@/lib/facturen";
import { euro, datumKort } from "@/lib/format";
import { maakFactuur } from "./acties";

export default async function FacturenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let facturen: Factuur[] = [];
  let klanten: { id: string; bedrijfsnaam: string }[] = [];
  let schemaOntbreekt = false;
  try {
    const [f, k] = await Promise.all([
      supabase.from("facturen").select("*").order("factuurdatum", { ascending: false }),
      supabase.from("klanten").select("id, bedrijfsnaam").order("bedrijfsnaam"),
    ]);
    if (f.error) throw f.error;
    facturen = (f.data ?? []) as Factuur[];
    klanten = k.data ?? [];
  } catch {
    schemaOntbreekt = true;
  }

  const openstaand = facturen.filter((f) =>
    ["verzonden", "te_laat"].includes(f.status),
  );
  const openstaandBedrag = openstaand.reduce((s, f) => s + Number(f.bedrag || 0), 0);
  const teLaat = facturen.filter((f) => f.status === "te_laat").length;

  const nu = new Date();
  const betaaldMaand = facturen
    .filter(
      (f) =>
        f.status === "betaald" &&
        f.betaald_op &&
        new Date(f.betaald_op).getMonth() === nu.getMonth() &&
        new Date(f.betaald_op).getFullYear() === nu.getFullYear(),
    )
    .reduce((s, f) => s + Number(f.bedrag || 0), 0);

  return (
    <>
      <PaginaKop
        titel="Facturen"
        omschrijving="Inschieten, vervaldatum bewaken en herinneringen plannen."
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKaart label="Openstaand" waarde={euro(openstaandBedrag)} />
        <KpiKaart label="Te laat" waarde={String(teLaat)} accent={teLaat > 0} />
        <KpiKaart label="Omzet deze maand" waarde={euro(betaaldMaand)} />
        <KpiKaart label="Totaal facturen" waarde={String(facturen.length)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form
        action={maakFactuur}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
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
        <input
          name="bedrag"
          type="number"
          step="0.01"
          placeholder="Bedrag excl."
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="btw_percentage"
          type="number"
          defaultValue={21}
          title="Btw %"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="vervaldatum"
          type="date"
          title="Vervaldatum"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Inschieten
        </button>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de migraties uit in de Supabase SQL Editor.</p>
        </div>
      ) : facturen.length === 0 ? (
        <LegeStaat titel="Nog geen facturen" omschrijving="Schiet je eerste factuur hierboven in." />
      ) : (
        <Kaart className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Bedrag</th>
                <th className="px-5 py-3 font-medium">Vervaldatum</th>
              </tr>
            </thead>
            <tbody>
              {facturen.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3">
                    <Link href={`/facturen/${f.id}`} className="text-navy hover:underline">
                      {f.nummer}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge toon={factuurStatusToon(f.status)}>
                      {FACTUUR_STATUSSEN.find((s) => s.key === f.status)?.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-navy">{euro(f.bedrag)}</td>
                  <td className="px-5 py-3 text-navy/50">
                    {f.vervaldatum ? datumKort(f.vervaldatum) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}
