import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { createClient } from "@/lib/supabase/server";
import { type Lead } from "@/lib/leads";
import { euro } from "@/lib/format";
import { SnelToevoegen } from "./SnelToevoegen";
import { KanbanBord } from "./KanbanBord";

async function haalLeads(): Promise<{ leads: Lead[]; schemaOntbreekt: boolean }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("positie", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { leads: (data ?? []) as Lead[], schemaOntbreekt: false };
  } catch {
    return { leads: [], schemaOntbreekt: true };
  }
}

export default async function LeadsPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const { leads, schemaOntbreekt } = await haalLeads();

  const actief = leads.filter((l) => l.status !== "gewonnen");
  const pipelineWaarde = actief.reduce(
    (s, l) => s + Number(l.verwachte_waarde || 0),
    0,
  );
  const gewonnen = leads.filter((l) => l.status === "gewonnen").length;
  const gemScore =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
      : 0;

  return (
    <>
      <PaginaKop
        titel="Leads & pipeline"
        omschrijving="Sleep leads tussen de kolommen om de status bij te werken."
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiKaart label="Totaal leads" waarde={String(leads.length)} />
        <KpiKaart label="Actief in pipeline" waarde={String(actief.length)} />
        <KpiKaart label="Pipeline-waarde" waarde={euro(pipelineWaarde)} />
        <KpiKaart label="Gewonnen" waarde={String(gewonnen)} subtekst={`gem. score ${gemScore}`} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <SnelToevoegen />

      {schemaOntbreekt ? (
        <SchemaMelding />
      ) : (
        <KanbanBord leads={leads} />
      )}
    </>
  );
}

function SchemaMelding() {
  return (
    <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
      <p className="font-medium text-oranje">Datamodel nog niet actief</p>
      <p className="mt-1 text-navy/70">
        Voer <code className="rounded bg-navy/5 px-1">0004_canoniek_datamodel.sql</code>{" "}
        (en optioneel <code className="rounded bg-navy/5 px-1">seed.sql</code>) uit in
        de Supabase SQL Editor.
      </p>
    </div>
  );
}
