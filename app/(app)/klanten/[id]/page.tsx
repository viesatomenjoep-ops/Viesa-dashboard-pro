import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { euro, datumKort } from "@/lib/format";
import {
  BRANCHES,
  REGIOS,
  LANDEN,
  KLANT_TYPES,
  klantTypeToon,
  klantTypeLabel,
  type Klant,
} from "@/lib/klanten";
import {
  werkKlantBij,
  verwijderKlant,
  maakOfferteVoorKlant,
  maakFactuurVoorKlant,
  maakLeadVoorKlant,
  maakAuditVoorKlant,
} from "../acties";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function KlantDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from("klanten").select("*").eq("id", params.id).single();
  if (error || !data) notFound();
  const klant = data as Klant;

  const [{ data: leads }, { data: offertes }, { data: facturen }] = await Promise.all([
    supabase.from("leads").select("id, bedrijf, status").eq("klant_id", klant.id),
    supabase.from("offertes").select("id, nummer, titel, status, bedrag").eq("klant_id", klant.id),
    supabase.from("facturen").select("id, nummer, status, bedrag").eq("klant_id", klant.id),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/klanten" className="text-sm text-navy/60 hover:underline">
            ← Terug naar klanten
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {klant.bedrijf}
            <Badge toon={klantTypeToon(klant.type)}>{klantTypeLabel(klant.type)}</Badge>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={maakOfferteVoorKlant.bind(null, klant.id)}>
            <button className="rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90">
              Nieuwe offerte
            </button>
          </form>
          <form action={maakFactuurVoorKlant.bind(null, klant.id)}>
            <button className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5">
              Nieuwe factuur
            </button>
          </form>
          <form action={maakAuditVoorKlant.bind(null, klant.id)}>
            <button className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5">
              Nieuwe audit
            </button>
          </form>
          <form action={maakLeadVoorKlant.bind(null, klant.id)}>
            <button className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5">
              Nieuwe lead
            </button>
          </form>
        </div>
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Opgeslagen.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gegevens */}
        <form action={werkKlantBij.bind(null, klant.id)} className="lg:col-span-2">
          <Kaart>
            <div className="grid gap-3 sm:grid-cols-2">
              <Veld label="Bedrijf" naam="bedrijf" waarde={klant.bedrijf} verplicht />
              <Veld label="Contactpersoon" naam="contact_naam" waarde={klant.contact_naam} />
              <Veld label="E-mail" naam="email" waarde={klant.email} type="email" />
              <Veld label="Telefoon" naam="telefoon" waarde={klant.telefoon} />
              <Veld label="Website" naam="website" waarde={klant.website} />
              <Veld label="Straat + nr" naam="straat" waarde={klant.straat} />
              <Veld label="Postcode" naam="postcode" waarde={klant.postcode} />
              <Veld label="Stad" naam="stad" waarde={klant.stad} />
              <Kies label="Regio" naam="regio" waarde={klant.regio} opties={[...REGIOS]} leeg="Regio…" />
              <Kies label="Land" naam="land" waarde={klant.land} opties={[...LANDEN]} />
              <Kies label="Branche" naam="branche" waarde={klant.branche} opties={[...BRANCHES]} leeg="Branche…" />
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Type</label>
                <select name="type" defaultValue={klant.type} className={inputCls}>
                  {KLANT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-navy">Notities</label>
              <textarea name="notities" defaultValue={klant.notities ?? ""} rows={3} className={inputCls} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90">
                Opslaan
              </button>
              <form action={verwijderKlant.bind(null, klant.id)}>
                <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  Verwijderen
                </button>
              </form>
            </div>
          </Kaart>
        </form>

        {/* Gekoppelde items */}
        <div className="space-y-4">
          <Gekoppeld titel="Leads" leeg="Geen leads">
            {(leads ?? []).map((l) => (
              <Rij key={l.id} href={`/leads/${l.id}`} links={l.bedrijf} rechts={l.status} />
            ))}
          </Gekoppeld>
          <Gekoppeld titel="Offertes" leeg="Geen offertes">
            {(offertes ?? []).map((o) => (
              <Rij key={o.id} href={`/offertes/${o.id}`} links={o.nummer} rechts={euro(o.bedrag)} />
            ))}
          </Gekoppeld>
          <Gekoppeld titel="Facturen" leeg="Geen facturen">
            {(facturen ?? []).map((f) => (
              <Rij key={f.id} href={`/facturen/${f.id}`} links={f.nummer} rechts={euro(f.bedrag)} />
            ))}
          </Gekoppeld>
        </div>
      </div>

      <p className="mt-4 text-xs text-navy/40">Aangemaakt {datumKort(klant.created_at)}</p>
    </>
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
      <label className="mb-1 block text-sm font-medium text-navy">{label}</label>
      <input name={naam} type={type} required={verplicht} defaultValue={waarde ?? ""} className={inputCls} />
    </div>
  );
}

function Kies({
  label,
  naam,
  waarde,
  opties,
  leeg,
}: {
  label: string;
  naam: string;
  waarde: string | null;
  opties: string[];
  leeg?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">{label}</label>
      <select name={naam} defaultValue={waarde ?? ""} className={inputCls}>
        {leeg && <option value="">{leeg}</option>}
        {opties.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Gekoppeld({
  titel,
  leeg,
  children,
}: {
  titel: string;
  leeg: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const heeft = items.filter(Boolean).length > 0;
  return (
    <Kaart>
      <h2 className="text-sm font-medium text-navy">{titel}</h2>
      {heeft ? (
        <ul className="mt-2 divide-y divide-navy/10">{children}</ul>
      ) : (
        <p className="mt-2 text-sm text-navy/50">{leeg}</p>
      )}
    </Kaart>
  );
}

function Rij({ href, links, rechts }: { href: string; links: string; rechts: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between py-2 text-sm hover:text-navy">
        <span className="text-navy">{links}</span>
        <span className="text-navy/50">{rechts}</span>
      </Link>
    </li>
  );
}
