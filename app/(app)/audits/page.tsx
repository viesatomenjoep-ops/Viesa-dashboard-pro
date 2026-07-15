import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { auditStatusToon, AUDIT_STATUSSEN, type Audit } from "@/lib/audits";
import { datumKort } from "@/lib/format";
import { leesFout } from "@/lib/fout";
import { maakAudit } from "./acties";

export const dynamic = "force-dynamic";

export default async function AuditsPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let audits: Audit[] = [];
  let klanten: { id: string; bedrijf: string }[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const [a, k] = await Promise.all([
      supabase.from("audits").select("*").order("created_at", { ascending: false }),
      supabase.from("klanten").select("id, bedrijf").order("bedrijf"),
    ]);
    if (a.error) throw a.error;
    audits = (a.data ?? []) as Audit[];
    klanten = k.data ?? [];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  return (
    <>
      <PaginaKop
        titel="Audits"
        omschrijving="Auditverslagen in de Viesa-huisstijl — direct te exporteren als PDF."
      />

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form
        action={maakAudit}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_auto]"
      >
        <input
          name="titel"
          placeholder="Titel auditverslag"
          defaultValue="Auditverslag"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <select
          name="klant_id"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Geen klant</option>
          {klanten.map((k) => (
            <option key={k.id} value={k.id}>{k.bedrijf}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Nieuwe audit
        </button>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0009_audits.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : audits.length === 0 ? (
        <LegeStaat titel="Nog geen audits" omschrijving="Maak je eerste auditverslag hierboven aan." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Titel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/audits/${a.id}`} className="text-navy hover:underline">{a.nummer}</Link>
                  </td>
                  <td className="px-5 py-3 text-navy">{a.titel}</td>
                  <td className="px-5 py-3">
                    <Badge toon={auditStatusToon(a.status)}>
                      {AUDIT_STATUSSEN.find((s) => s.key === a.status)?.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-navy/50">{datumKort(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}
    </>
  );
}
