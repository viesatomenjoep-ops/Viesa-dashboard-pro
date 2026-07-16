import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { auditStatusToon, AUDIT_STATUSSEN, type Audit } from "@/lib/audits";
import { KlantZoeker } from "@/components/KlantZoeker";
import { BevestigKnop } from "@/components/ui/BevestigKnop";
import { datumKort } from "@/lib/format";
import { RijLink } from "@/components/ui/RijLink";
import { VolScherm } from "@/components/ui/VolScherm";
import { Plus } from "lucide-react";
import { leesFout } from "@/lib/fout";
import { maakAudit, verwijderAudit } from "./acties";

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

      <div className="mb-8">
        <VolScherm label="Nieuwe audit" titel="Nieuwe audit" icoon={<Plus size={16} />}>
          <form action={maakAudit} className="space-y-3">
            <input
              name="titel"
              placeholder="Titel auditverslag"
              defaultValue="Auditverslag"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
            <KlantZoeker
              klanten={klanten}
              tekstNaam="klant_naam"
              placeholder="Klant zoeken (optioneel)…"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Audit aanmaken
            </button>
          </form>
        </VolScherm>
      </div>

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-3 py-3 font-medium sm:px-5">Nummer</th>
                <th className="px-3 py-3 font-medium sm:px-5">Titel</th>
                <th className="px-3 py-3 font-medium sm:px-5">Status</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <RijLink
                  key={a.id}
                  href={`/audits/${a.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-3 py-3 font-medium text-navy sm:px-5">{a.nummer}</td>
                  <td className="max-w-[36vw] truncate px-3 py-3 text-navy sm:max-w-none sm:px-5">
                    {a.titel}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <Badge toon={auditStatusToon(a.status)}>
                      {AUDIT_STATUSSEN.find((s) => s.key === a.status)?.label}
                    </Badge>
                  </td>
                  <td className="hidden px-3 py-3 text-navy/50 sm:table-cell sm:px-5">
                    {datumKort(a.created_at)}
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
