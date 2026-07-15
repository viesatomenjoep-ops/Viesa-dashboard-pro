import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { RijLink } from "@/components/ui/RijLink";
import { createClient } from "@/lib/supabase/server";
import {
  factuurStatusToon,
  factuurStatusLabel,
  betaaltermijnDagen,
  type Factuur,
} from "@/lib/facturen";
import { Logo } from "@/components/ui/Logo";
import { euro, datumKort } from "@/lib/format";
import { maakFactuur } from "./acties";

export default async function FacturenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let facturen: Factuur[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("facturen")
      .select("*")
      .order("factuurdatum", { ascending: false });
    if (error) throw error;
    facturen = (data ?? []) as Factuur[];
  } catch {
    schemaOntbreekt = true;
  }

  const open = facturen.filter((f) => f.status === "open");
  const vervallen = facturen.filter((f) => f.status === "vervallen");

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

  const termijnen = facturen
    .map(betaaltermijnDagen)
    .filter((d): d is number => d !== null);
  const gemTermijn =
    termijnen.length > 0
      ? Math.round(termijnen.reduce((s, d) => s + d, 0) / termijnen.length)
      : null;

  return (
    <>
      <PaginaKop
        titel="Facturen"
        omschrijving="Inschieten, vervaldatum bewaken en betaald zetten."
        actie={<Logo size={48} />}
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKaart
          label="Open"
          waarde={euro(open.reduce((s, f) => s + Number(f.bedrag || 0), 0))}
          subtekst={`${open.length} facturen`}
        />
        <KpiKaart
          label="Vervallen"
          waarde={euro(vervallen.reduce((s, f) => s + Number(f.bedrag || 0), 0))}
          accent={vervallen.length > 0}
          subtekst={`${vervallen.length} facturen`}
        />
        <KpiKaart label="Betaald deze maand" waarde={euro(betaaldMaand)} />
        <KpiKaart
          label="Gem. betaaltermijn"
          waarde={gemTermijn === null ? "—" : `${gemTermijn} dgn`}
        />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Factuur inschieten */}
      <form
        action={maakFactuur}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <input
          name="klant"
          placeholder="Klant"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
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
          Inschieten
        </button>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0004 uit in de Supabase SQL Editor.</p>
        </div>
      ) : facturen.length === 0 ? (
        <LegeStaat titel="Nog geen facturen" omschrijving="Schiet je eerste factuur hierboven in." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Klant</th>
                <th className="px-5 py-3 font-medium">Bedrag</th>
                <th className="px-5 py-3 font-medium">Vervaldatum</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {facturen.map((f) => (
                <RijLink
                  key={f.id}
                  href={`/facturen/${f.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3 font-medium text-navy">{f.nummer}</td>
                  <td className="px-5 py-3 text-navy">{f.klant ?? "—"}</td>
                  <td className="px-5 py-3 text-navy">{euro(f.bedrag)}</td>
                  <td className="px-5 py-3 text-navy/50">
                    {f.vervaldatum ? datumKort(f.vervaldatum) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge toon={factuurStatusToon(f.status)}>
                      {factuurStatusLabel(f.status)}
                    </Badge>
                  </td>
                </RijLink>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}
