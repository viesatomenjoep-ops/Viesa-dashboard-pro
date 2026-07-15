import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import {
  factuurStatusToon,
  factuurStatusLabel,
  inclBtw,
  dagenTeLaat,
  type Factuur,
} from "@/lib/facturen";
import { euro } from "@/lib/format";
import {
  werkFactuurBij,
  markeerBetaald,
  markeerOpen,
  markeerVervallen,
  heropenFactuur,
  stuurFactuurHerinnering,
  verwijderFactuur,
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
  const f = data as Factuur;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/facturen" className="text-sm text-navy/60 hover:underline">
            ← Terug naar facturen
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {f.nummer}
            <Badge toon={factuurStatusToon(f.status)}>{factuurStatusLabel(f.status)}</Badge>
          </h1>
          {f.klant && <p className="text-sm text-navy/50">{f.klant}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/print/factuur/${f.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Exporteer als PDF
          </a>
          <form action={verwijderFactuur.bind(null, f.id)}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Verwijderen
            </button>
          </form>
        </div>
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
          {/* Statusflow */}
          <Kaart>
            <p className="mb-3 text-sm font-medium text-navy">Status</p>
            {(() => {
              const teLaat = dagenTeLaat(f);
              return teLaat ? (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {teLaat} dag{teLaat === 1 ? "" : "en"} over de vervaldatum.
                </p>
              ) : null;
            })()}
            {f.herinnering_verstuurd_op && f.status !== "betaald" && (
              <p className="mb-3 text-xs text-navy/50">
                Laatste herinnering verstuurd op{" "}
                {new Date(f.herinnering_verstuurd_op).toLocaleDateString("nl-NL")}.
              </p>
            )}
            {f.status === "concept" ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-navy/60">
                  Concept — nog niet verstuurd.
                </span>
                <form action={markeerOpen.bind(null, f.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                  >
                    Op open zetten
                  </button>
                </form>
              </div>
            ) : f.status !== "betaald" ? (
              <div className="flex flex-wrap items-end gap-3">
                <form action={markeerBetaald.bind(null, f.id)} className="flex items-end gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-navy/50">Betaaldatum</label>
                    <input
                      name="betaald_op"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Betaald
                  </button>
                </form>
                {f.status !== "vervallen" && (
                  <form action={markeerVervallen.bind(null, f.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Vervallen
                    </button>
                  </form>
                )}
                <form action={stuurFactuurHerinnering.bind(null, f.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                  >
                    Herinnering sturen
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-navy/70">
                  Betaald op {f.betaald_op}
                </span>
                <form action={heropenFactuur.bind(null, f.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm text-navy hover:bg-navy/5"
                  >
                    Heropenen
                  </button>
                </form>
              </div>
            )}
          </Kaart>

          {/* Bewerken */}
          <form action={werkFactuurBij.bind(null, f.id)}>
            <Kaart>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Klant" naam="klant" waarde={f.klant ?? ""} />
                <Veld label="Bedrag (excl. btw)" naam="bedrag" type="number" waarde={String(f.bedrag)} />
                <Veld label="Btw %" naam="btw_percentage" type="number" waarde={String(f.btw_percentage)} />
                <Veld label="Factuurdatum" naam="factuurdatum" type="date" waarde={f.factuurdatum} />
                <Veld label="Vervaldatum" naam="vervaldatum" type="date" waarde={f.vervaldatum ?? ""} />
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-navy">
                  PDF-link (Google Drive)
                </label>
                <input
                  name="drive_pdf_url"
                  type="url"
                  defaultValue={f.drive_pdf_url ?? ""}
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

        <div>
          <Kaart>
            <h2 className="text-sm font-medium text-navy">Bedragen</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Rij label="Excl. btw" waarde={euro(f.bedrag)} />
              <Rij
                label={`Btw ${f.btw_percentage}%`}
                waarde={euro(inclBtw(f.bedrag, f.btw_percentage) - f.bedrag)}
              />
              <Rij label="Totaal" waarde={euro(inclBtw(f.bedrag, f.btw_percentage))} sterk />
            </dl>
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
