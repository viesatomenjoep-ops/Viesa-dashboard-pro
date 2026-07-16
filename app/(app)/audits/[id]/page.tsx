import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { DocumentBewerker } from "@/components/DocumentBewerker";
import { contextVanKlant } from "@/lib/variabelen";
import { tekstNaarHtml } from "@/lib/sjablonen";
import { auditStatusToon, AUDIT_STATUSSEN, type Audit } from "@/lib/audits";
import { werkAuditBij, wijzigAuditStatus, verwijderAudit } from "../acties";

export default async function AuditDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.from("audits").select("*").eq("id", params.id).single();
  if (error || !data) notFound();
  const audit = data as Audit;

  // Audit-sjablonen + klant-context voor de variabelen (best effort).
  let auditSjablonen: { id: string; naam: string; inhoud_html: string }[] = [];
  try {
    const { data: sj } = await supabase
      .from("sjablonen")
      .select("id, naam, inhoud_html")
      .eq("type", "audit")
      .order("naam");
    auditSjablonen = sj ?? [];
  } catch {
    /* sjablonen-tabel nog niet aanwezig */
  }
  let klantCtx = {};
  if (audit.klant_id) {
    const { data: k } = await supabase
      .from("klanten")
      .select("bedrijf, contact_naam, voornaam, achternaam, website, stad, email, telefoon")
      .eq("id", audit.klant_id)
      .maybeSingle();
    if (k) klantCtx = contextVanKlant(k);
  }
  const beginHtml = audit.inhoud_html || tekstNaarHtml(audit.inhoud_markdown ?? "");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/audits" className="text-sm text-navy/60 hover:underline">
            ← Terug naar audits
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {audit.nummer}
            <Badge toon={auditStatusToon(audit.status)}>
              {AUDIT_STATUSSEN.find((s) => s.key === audit.status)?.label}
            </Badge>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/print/audit/${audit.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Exporteer als PDF
          </a>
          <form action={verwijderAudit.bind(null, audit.id)}>
            <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
              Verwijderen
            </button>
          </form>
        </div>
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Opgeslagen.</p>
      )}

      <Kaart className="mb-6">
        <p className="mb-2 text-sm font-medium text-navy">Status</p>
        <div className="flex flex-wrap gap-2">
          {AUDIT_STATUSSEN.map((s) => (
            <form key={s.key} action={wijzigAuditStatus.bind(null, audit.id, s.key)}>
              <button
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  audit.status === s.key
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

      <form action={werkAuditBij.bind(null, audit.id)}>
        <Kaart>
          <label className="mb-1 block text-sm font-medium text-navy">Titel</label>
          <input
            name="titel"
            defaultValue={audit.titel}
            className="mb-4 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <label className="mb-1 block text-sm font-medium text-navy">Inhoud auditverslag</label>
          <DocumentBewerker beginHtml={beginHtml} sjablonen={auditSjablonen} ctx={klantCtx} />
          <div className="mt-4">
            <button className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90">
              Opslaan
            </button>
          </div>
        </Kaart>
      </form>
    </>
  );
}
