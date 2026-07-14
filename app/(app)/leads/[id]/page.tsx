import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STAGES, scoreToon, type Lead } from "@/lib/leads";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { datumKort } from "@/lib/format";
import { werkLeadBij, maakKlantVanLead, verwijderLead } from "../acties";

export default async function LeadDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string; klant?: string; fout?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();
  const lead = data as Lead;

  const opslaan = werkLeadBij.bind(null, lead.id);
  const naarKlant = maakKlantVanLead.bind(null, lead.id);
  const verwijder = verwijderLead.bind(null, lead.id);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/leads" className="text-sm text-navy/60 hover:underline">
            ← Terug naar pipeline
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {lead.bedrijfsnaam}
            <Badge toon={scoreToon(lead.score)}>score {lead.score}</Badge>
            {lead.klant_id && <Badge toon="groen">klant</Badge>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!lead.klant_id && (
            <form action={naarKlant}>
              <button
                type="submit"
                className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
              >
                Maak klant
              </button>
            </form>
          )}
          <form action={verwijder}>
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
          Wijzigingen opgeslagen.
        </p>
      )}
      {searchParams.klant && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Klant aangemaakt en lead op &lsquo;gewonnen&rsquo; gezet.
        </p>
      )}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bewerkformulier */}
        <form action={opslaan} className="lg:col-span-2">
          <Kaart>
            <div className="grid gap-4 sm:grid-cols-2">
              <Veld label="Bedrijfsnaam" naam="bedrijfsnaam" waarde={lead.bedrijfsnaam} verplicht />
              <Veld label="Website" naam="website" waarde={lead.website} />
              <Veld label="Contactpersoon" naam="contact_naam" waarde={lead.contact_naam} />
              <Veld label="E-mail" naam="email" waarde={lead.email} type="email" />
              <Veld label="Telefoon" naam="telefoon" waarde={lead.telefoon} />
              <div>
                <Etiket>Stage</Etiket>
                <select
                  name="stage"
                  defaultValue={lead.stage}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Veld label="Score (0-100)" naam="score" waarde={String(lead.score)} type="number" />
              <Veld
                label="Geschatte waarde (€)"
                naam="geschatte_waarde"
                waarde={String(lead.geschatte_waarde)}
                type="number"
              />
            </div>

            <div className="mt-4">
              <Etiket>Openingszin</Etiket>
              <textarea
                name="openingszin"
                defaultValue={lead.openingszin ?? ""}
                rows={2}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            <div className="mt-4">
              <Etiket>Notities</Etiket>
              <textarea
                name="notities"
                defaultValue={lead.notities ?? ""}
                rows={4}
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

        {/* Signalen + meta */}
        <div className="space-y-6">
          <Kaart>
            <h2 className="text-sm font-medium text-navy">Signalen</h2>
            {lead.signalen && lead.signalen.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {lead.signalen.map((sig, i) => (
                  <li key={i} className="text-sm text-navy/70">
                    <span className="font-medium text-navy">{sig.type}</span>
                    {sig.waarde ? `: ${sig.waarde}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-navy/50">
                Nog geen signalen. De prospector vult deze automatisch.
              </p>
            )}
          </Kaart>

          <Kaart>
            <h2 className="text-sm font-medium text-navy">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Rij label="Bron" waarde={lead.bron} />
              <Rij label="Aangemaakt" waarde={datumKort(lead.created_at)} />
              <Rij label="Bijgewerkt" waarde={datumKort(lead.updated_at)} />
            </dl>
          </Kaart>
        </div>
      </div>
    </>
  );
}

function Etiket({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-navy">{children}</label>
  );
}

function Veld({
  label,
  naam,
  waarde,
  type = "text",
  verplicht = false,
}: {
  label: string;
  naam: string;
  waarde: string | null;
  type?: string;
  verplicht?: boolean;
}) {
  return (
    <div>
      <Etiket>{label}</Etiket>
      <input
        name={naam}
        type={type}
        required={verplicht}
        defaultValue={waarde ?? ""}
        className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
    </div>
  );
}

function Rij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-navy/50">{label}</dt>
      <dd className="text-navy">{waarde}</dd>
    </div>
  );
}
