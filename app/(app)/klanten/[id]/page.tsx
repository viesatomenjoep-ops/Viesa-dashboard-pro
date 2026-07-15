import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { euro, datumKort } from "@/lib/format";
import {
  BRANCHES,
  KLANT_TYPES,
  klantTypeToon,
  klantTypeLabel,
  type Klant,
} from "@/lib/klanten";
import { LandRegio } from "@/components/LandRegio";
import {
  DRIVE_LINK_TYPES,
  driveTypeLabel,
  STANDAARD_CATEGORIEEN,
  type DriveLink,
} from "@/lib/drivelinks";
import {
  werkKlantBij,
  verwijderKlant,
  maakOfferteVoorKlant,
  maakFactuurVoorKlant,
  maakLeadVoorKlant,
  maakAuditVoorKlant,
  voegKlantBestandToe,
  verwijderKlantBestand,
} from "../acties";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function KlantDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string; fout?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from("klanten").select("*").eq("id", params.id).single();
  if (error || !data) notFound();
  const klant = data as Klant;

  const [
    { data: leads },
    { data: offertes },
    { data: facturen },
    { data: projecten },
    { data: bestanden },
    { data: cats },
  ] = await Promise.all([
    supabase.from("leads").select("id, bedrijf, status").eq("klant_id", klant.id),
    supabase.from("offertes").select("id, nummer, titel, status, bedrag").eq("klant_id", klant.id),
    supabase.from("facturen").select("id, nummer, status, bedrag").eq("klant_id", klant.id),
    supabase.from("projecten").select("id, naam, status").eq("klant_id", klant.id),
    supabase
      .from("drive_links")
      .select("*")
      .eq("context_type", "klant")
      .eq("context_id", klant.id)
      .order("created_at", { ascending: false }),
    supabase.from("bestand_categorieen").select("naam").order("naam"),
  ]);

  const klantBestanden = (bestanden ?? []) as DriveLink[];
  const categorieen = Array.from(
    new Set([
      ...STANDAARD_CATEGORIEEN,
      ...(cats ?? []).map((c) => c.naam as string),
      ...(klantBestanden.map((b) => b.categorie).filter(Boolean) as string[]),
    ]),
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/klanten" className="text-sm text-navy/60 hover:underline">
            ← Terug naar klanten
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-navy">
            {klant.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={klant.logo_url}
                alt={`Logo ${klant.bedrijf}`}
                className="h-8 w-8 rounded object-contain"
              />
            )}
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
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">{searchParams.fout}</p>
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
              <Veld label="Logo-URL (offerte)" naam="logo_url" waarde={klant.logo_url} type="url" />
              <Veld label="Straat + nr" naam="straat" waarde={klant.straat} />
              <Veld label="Postcode" naam="postcode" waarde={klant.postcode} />
              <Veld label="Stad" naam="stad" waarde={klant.stad} />
              <LandRegio land={klant.land} regio={klant.regio ?? ""} className={inputCls} toonLabels />
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
          <Gekoppeld titel="Projecten" leeg="Geen projecten">
            {(projecten ?? []).map((p) => (
              <Rij key={p.id} href={`/projecten/${p.id}`} links={p.naam} rechts={p.status} />
            ))}
          </Gekoppeld>
        </div>
      </div>

      {/* Bestanden van deze klant */}
      <div className="mt-6">
        <Kaart>
          <h2 className="text-sm font-medium text-navy">Bestanden</h2>
          <p className="mt-1 text-xs text-navy/60">
            Interne docs, Excel-sheets en links van deze klant — met categorie. Alleen
            links, nooit bestanden zelf.
          </p>

          <form
            action={voegKlantBestandToe.bind(null, klant.id)}
            className="mt-3 grid gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]"
          >
            <input name="titel" placeholder="Titel" className={inputCls} />
            <input name="url" type="url" required placeholder="https://… *" className={inputCls} />
            <select name="type" className={inputCls}>
              {DRIVE_LINK_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <input
              name="categorie"
              list="klant-categorieen"
              placeholder="Categorie"
              className={inputCls}
            />
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              + Toevoegen
            </button>
            <datalist id="klant-categorieen">
              {categorieen.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </form>

          {klantBestanden.length === 0 ? (
            <p className="mt-4 text-sm text-navy/50">Nog geen bestanden voor deze klant.</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy/10">
              {klantBestanden.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge toon="navy">{driveTypeLabel(b.type)}</Badge>
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium text-navy hover:underline"
                    >
                      {b.titel}
                    </a>
                    {b.categorie && (
                      <span className="hidden text-xs text-navy/40 sm:inline">· {b.categorie}</span>
                    )}
                  </div>
                  <form action={verwijderKlantBestand.bind(null, klant.id, b.id)}>
                    <button type="submit" className="text-navy/30 hover:text-red-500">×</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Kaart>
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
