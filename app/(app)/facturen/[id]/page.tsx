import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import {
  factuurStatusToon,
  FACTUUR_STATUSSEN,
  inclBtw,
  type Factuur,
  type Herinnering,
} from "@/lib/facturen";
import { euro, datumKort } from "@/lib/format";
import {
  werkFactuurBij,
  wijzigFactuurStatus,
  verwijderFactuur,
  planHerinnering,
} from "../acties";

export default async function FactuurDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string; fout?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("facturen")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const factuur = data as Factuur;

  const { data: hData } = await supabase
    .from("factuur_herinneringen")
    .select("*")
    .eq("factuur_id", factuur.id)
    .order("created_at", { ascending: false });
  const herinneringen = (hData ?? []) as Herinnering[];

  const opslaan = werkFactuurBij.bind(null, factuur.id);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/facturen" className="text-sm text-navy/60 hover:underline">
            ← Terug naar facturen
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {factuur.nummer}
            <Badge toon={factuurStatusToon(factuur.status)}>
              {FACTUUR_STATUSSEN.find((s) => s.key === factuur.status)?.label}
            </Badge>
          </h1>
        </div>
        <form action={verwijderFactuur.bind(null, factuur.id)}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Verwijderen
          </button>
        </form>
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Opgeslagen.
        </p>
      )}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Kaart>
            <p className="mb-2 text-sm font-medium text-navy">Status</p>
            <div className="flex flex-wrap gap-2">
              {FACTUUR_STATUSSEN.map((s) => (
                <form key={s.key} action={wijzigFactuurStatus.bind(null, factuur.id, s.key)}>
                  <button
                    type="submit"
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      factuur.status === s.key
                        ? "border-oranje bg-oranje/10 font-medium text-oranje"
                        : "border-navy/20 text-navy hover:bg-navy/5"
                    }`}
                  >
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
          </Kaart>

          <form action={opslaan}>
            <Kaart>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Bedrag (excl. btw)" naam="bedrag" type="number" waarde={String(factuur.bedrag)} />
                <Veld label="Btw %" naam="btw_percentage" type="number" waarde={String(factuur.btw_percentage)} />
                <Veld label="Factuurdatum" naam="factuurdatum" type="date" waarde={factuur.factuurdatum} />
                <Veld label="Vervaldatum" naam="vervaldatum" type="date" waarde={factuur.vervaldatum ?? ""} />
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-navy">
                  PDF-link (Google Drive)
                </label>
                <input
                  name="drive_pdf_url"
                  type="url"
                  defaultValue={factuur.drive_pdf_url ?? ""}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
              </div>
              <div className="mt-5">
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Opslaan
                </button>
              </div>
            </Kaart>
          </form>
        </div>

        <div className="space-y-6">
          <Kaart>
            <h2 className="text-sm font-medium text-navy">Bedragen</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Rij label="Excl. btw" waarde={euro(factuur.bedrag)} />
              <Rij label={`Btw ${factuur.btw_percentage}%`} waarde={euro(inclBtw(factuur.bedrag, factuur.btw_percentage) - factuur.bedrag)} />
              <Rij label="Totaal" waarde={euro(inclBtw(factuur.bedrag, factuur.btw_percentage))} sterk />
            </dl>
          </Kaart>

          <Kaart>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-navy">Herinneringen</h2>
              <form action={planHerinnering.bind(null, factuur.id)}>
                <button
                  type="submit"
                  className="text-sm text-oranje hover:underline"
                >
                  + Plannen
                </button>
              </form>
            </div>
            {herinneringen.length === 0 ? (
              <p className="mt-2 text-sm text-navy/50">
                Nog geen herinneringen. Verzending loopt via de Gmail/Outlook-koppeling.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {herinneringen.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span className="text-navy/70">{datumKort(h.created_at)}</span>
                    <Badge toon={h.status === "verzonden" ? "groen" : h.status === "mislukt" ? "rood" : "grijs"}>
                      {h.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Kaart>
        </div>
      </div>
    </>
  );
}

function Veld({
  label,
  naam,
  waarde,
  type = "text",
}: {
  label: string;
  naam: string;
  waarde: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">{label}</label>
      <input
        name={naam}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        defaultValue={waarde}
        className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
    </div>
  );
}

function Rij({ label, waarde, sterk = false }: { label: string; waarde: string; sterk?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navy/50">{label}</dt>
      <dd className={sterk ? "font-semibold text-navy" : "text-navy"}>{waarde}</dd>
    </div>
  );
}
