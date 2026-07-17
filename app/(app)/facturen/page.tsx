import { AlertTriangle, CalendarClock, CheckCircle2, FileClock } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { TegelSheet } from "@/components/ui/TegelSheet";
import { FacturenLijst } from "@/components/FacturenLijst";
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
import { KlantZoeker } from "@/components/KlantZoeker";
import { euro, datumKort } from "@/lib/format";
import { maakFactuur } from "./acties";

export default async function FacturenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let facturen: Factuur[] = [];
  let klanten: { id: string; bedrijf: string }[] = [];
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
  try {
    const { data } = await supabase.from("klanten").select("id, bedrijf").order("bedrijf");
    klanten = data ?? [];
  } catch {
    /* klanten-tabel nog niet aanwezig */
  }

  const open = facturen.filter((f) => f.status === "open");
  const vervallen = facturen.filter((f) => f.status === "vervallen");

  const nu = new Date();
  const betaaldMaandLijst = facturen.filter(
    (f) =>
      f.status === "betaald" &&
      f.betaald_op &&
      new Date(f.betaald_op).getMonth() === nu.getMonth() &&
      new Date(f.betaald_op).getFullYear() === nu.getFullYear(),
  );
  const betaaldMaand = betaaldMaandLijst.reduce((s, f) => s + Number(f.bedrag || 0), 0);

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
        titel="Facturenadministratie Viesa"
        omschrijving="Inschieten, vervaldatum bewaken en betaald zetten."
        actie={<Logo size={48} />}
      />

      {/* Vier tegels — klikken opent een vol scherm met de bijbehorende facturen (X sluit). */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TegelSheet
          titel="Openstaande facturen"
          tegel={
            <StatKaart
              label="Open"
              waarde={euro(open.reduce((s, f) => s + Number(f.bedrag || 0), 0))}
              subtekst={`${open.length} facturen`}
              icoon={FileClock}
              toon="blauw"
            />
          }
        >
          <FacturenLijst facturen={open} />
        </TegelSheet>
        <TegelSheet
          titel="Vervallen facturen"
          tegel={
            <StatKaart
              label="Vervallen"
              waarde={euro(vervallen.reduce((s, f) => s + Number(f.bedrag || 0), 0))}
              subtekst={`${vervallen.length} facturen`}
              icoon={AlertTriangle}
              toon={vervallen.length > 0 ? "rood" : "amber"}
            />
          }
        >
          <FacturenLijst facturen={vervallen} />
        </TegelSheet>
        <TegelSheet
          titel="Betaald deze maand"
          tegel={<StatKaart label="Betaald deze maand" waarde={euro(betaaldMaand)} icoon={CheckCircle2} toon="groen" />}
        >
          <FacturenLijst facturen={betaaldMaandLijst} />
        </TegelSheet>
        <TegelSheet
          titel="Alle facturen"
          tegel={
            <StatKaart
              label="Gem. betaaltermijn"
              waarde={gemTermijn === null ? "—" : `${gemTermijn} dgn`}
              icoon={CalendarClock}
              toon="paars"
            />
          }
        >
          <FacturenLijst facturen={facturen} />
        </TegelSheet>
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
        <KlantZoeker
          klanten={klanten}
          placeholder="Klant zoeken…"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="bedrag"
          type="number"
          step="0.01"
          placeholder="Bedrag excl. btw"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="btw_percentage"
          type="number"
          defaultValue={21}
          title="Btw-percentage"
          placeholder="Btw %"
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-3 py-3 font-medium sm:px-5">Nummer</th>
                <th className="px-3 py-3 font-medium sm:px-5">Klant</th>
                <th className="px-3 py-3 font-medium sm:px-5">Bedrag</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Vervaldatum</th>
                <th className="px-3 py-3 font-medium sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {facturen.map((f) => (
                <RijLink
                  key={f.id}
                  href={`/facturen/${f.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-3 py-3 font-medium text-navy sm:px-5">{f.nummer}</td>
                  <td className="max-w-[30vw] truncate px-3 py-3 text-navy sm:max-w-none sm:px-5">
                    {f.klant ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-navy sm:px-5">{euro(f.bedrag)}</td>
                  <td className="hidden px-3 py-3 text-navy/50 sm:table-cell sm:px-5">
                    {f.vervaldatum ? datumKort(f.vervaldatum) : "—"}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
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
