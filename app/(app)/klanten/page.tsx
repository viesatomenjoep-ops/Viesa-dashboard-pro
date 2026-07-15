import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { MassaImport } from "@/components/MassaImport";
import { createClient } from "@/lib/supabase/server";
import {
  BRANCHES,
  REGIOS,
  LANDEN,
  KLANT_TYPES,
  klantTypeToon,
  klantTypeLabel,
  type Klant,
} from "@/lib/klanten";
import { RijLink } from "@/components/ui/RijLink";
import { leesFout } from "@/lib/fout";
import { maakKlant, importeerKlanten } from "./acties";

// Altijd per-request renderen met de sessie van de ingelogde gebruiker
// (voorkomt een 'vastgebakken' banner uit een oude statische build).
export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function KlantenPagina({
  searchParams,
}: {
  searchParams: { branche?: string; regio?: string; type?: string; q?: string; fout?: string };
}) {
  const supabase = createClient();
  let klanten: Klant[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("klanten")
      .select("*")
      .order("bedrijf", { ascending: true });
    if (error) throw error;
    klanten = (data ?? []) as Klant[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const q = (searchParams.q ?? "").toLowerCase();
  const zichtbaar = klanten.filter((k) => {
    if (searchParams.branche && k.branche !== searchParams.branche) return false;
    if (searchParams.regio && k.regio !== searchParams.regio) return false;
    if (searchParams.type && k.type !== searchParams.type) return false;
    if (q && !`${k.bedrijf} ${k.stad ?? ""} ${k.email ?? ""}`.toLowerCase().includes(q))
      return false;
    return true;
  });

  return (
    <>
      <PaginaKop
        titel="Klanten"
        omschrijving="Je centrale klantenbestand — leads, offertes en facturen hangen hieraan."
      />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Totaal" waarde={String(klanten.length)} />
        <KpiKaart label="Klanten" waarde={String(klanten.filter((k) => k.type === "klant").length)} />
        <KpiKaart label="Prospects" waarde={String(klanten.filter((k) => k.type === "prospect").length)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Nieuwe klant */}
      <form action={maakKlant} className="mb-6">
        <Kaart>
          <p className="mb-3 text-sm font-medium text-navy">Nieuwe klant</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="bedrijf" required placeholder="Bedrijf *" className={inputCls} />
            <input name="contact_naam" placeholder="Contactpersoon" className={inputCls} />
            <input name="email" type="email" placeholder="E-mail" className={inputCls} />
            <input name="telefoon" placeholder="Telefoon" className={inputCls} />
            <input name="website" placeholder="Website" className={inputCls} />
            <input name="straat" placeholder="Straat + nr" className={inputCls} />
            <input name="postcode" placeholder="Postcode" className={inputCls} />
            <input name="stad" placeholder="Stad" className={inputCls} />
            <select name="regio" defaultValue="" className={inputCls}>
              <option value="">Regio…</option>
              {REGIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select name="land" defaultValue="Nederland" className={inputCls}>
              {LANDEN.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select name="branche" defaultValue="" className={inputCls}>
              <option value="">Branche…</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select name="type" defaultValue="prospect" className={inputCls}>
              {KLANT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              + Klant toevoegen
            </button>
          </div>
        </Kaart>
      </form>

      {/* Bulk-import */}
      <MassaImport
        titel="Klantenlijst importeren uit Excel"
        importActie={importeerKlanten}
        velden={[
          { key: "bedrijf", label: "Bedrijf", synoniemen: ["bedrijfsnaam", "company"] },
          { key: "contact_naam", label: "Contactpersoon", synoniemen: ["contact"] },
          { key: "email", label: "E-mail", synoniemen: ["e-mail", "mail"] },
          { key: "telefoon", label: "Telefoon", synoniemen: ["tel"] },
          { key: "website", label: "Website", synoniemen: ["url"] },
          { key: "stad", label: "Stad", synoniemen: ["plaats", "city"] },
          { key: "regio", label: "Regio", synoniemen: ["provincie"] },
          { key: "land", label: "Land" },
          { key: "branche", label: "Branche", synoniemen: ["niche", "sector"] },
          { key: "type", label: "Type" },
        ]}
      />

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Zoek…" className={inputCls} />
        <select name="branche" defaultValue={searchParams.branche ?? ""} className={inputCls}>
          <option value="">Alle branches</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select name="regio" defaultValue={searchParams.regio ?? ""} className={inputCls}>
          <option value="">Alle regio&apos;s</option>
          {REGIOS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select name="type" defaultValue={searchParams.type ?? ""} className={inputCls}>
          <option value="">Alle types</option>
          {KLANT_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy hover:bg-navy/5">
          Filter
        </button>
        <Link href="/klanten" className="text-sm text-navy/50 hover:underline">
          Wissen
        </Link>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0008_klanten.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : zichtbaar.length === 0 ? (
        <LegeStaat titel="Geen klanten" omschrijving="Voeg een klant toe of importeer een lijst." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Bedrijf</th>
                <th className="px-5 py-3 font-medium">Stad</th>
                <th className="px-5 py-3 font-medium">Regio</th>
                <th className="px-5 py-3 font-medium">Branche</th>
                <th className="px-5 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((k) => (
                <RijLink
                  key={k.id}
                  href={`/klanten/${k.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3 font-medium text-navy">{k.bedrijf}</td>
                  <td className="px-5 py-3 text-navy/70">{k.stad ?? "—"}</td>
                  <td className="px-5 py-3 text-navy/70">{k.regio ?? "—"}</td>
                  <td className="px-5 py-3 text-navy/70">{k.branche ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge toon={klantTypeToon(k.type)}>{klantTypeLabel(k.type)}</Badge>
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
