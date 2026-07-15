import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { createClient } from "@/lib/supabase/server";
import { type Lead } from "@/lib/leads";
import { euro } from "@/lib/format";
import { MassaImport } from "@/components/MassaImport";
import { SnelToevoegen } from "./SnelToevoegen";
import { KanbanBord } from "./KanbanBord";
import { importeerLeads } from "./acties";

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
  searchParams: { fout?: string; q?: string };
}) {
  const { leads: alle, schemaOntbreekt } = await haalLeads();

  const q = (searchParams.q ?? "").toLowerCase().trim();
  const leads = q
    ? alle.filter((l) =>
        `${l.bedrijf ?? ""} ${l.plaats ?? ""} ${l.website ?? ""} ${l.contact_naam ?? ""} ${l.email ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    : alle;

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

      {/* Zoeken op klant, plaats of website */}
      <form className="mb-6 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Zoek op klant, plaats of website…"
          className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy sm:w-80"
        />
        <button
          type="submit"
          className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Zoeken
        </button>
        {q && (
          <a href="/leads" className="text-sm text-navy/50 hover:underline">
            Wissen
          </a>
        )}
        {q && (
          <span className="text-xs text-navy/50">{leads.length} resultaat(en)</span>
        )}
      </form>

      <SnelToevoegen />

      <MassaImport
        titel="Lijst importeren uit Excel"
        importActie={importeerLeads}
        velden={[
          { key: "bedrijf", label: "Bedrijf", synoniemen: ["bedrijfsnaam", "company", "naam"] },
          { key: "plaats", label: "Plaats", synoniemen: ["stad", "city", "woonplaats"] },
          { key: "website", label: "Website", synoniemen: ["url", "site"] },
          { key: "contact_naam", label: "Contactpersoon", synoniemen: ["contact", "naam contact"] },
          { key: "email", label: "E-mail", synoniemen: ["e-mail", "mail"] },
          { key: "telefoon", label: "Telefoon", synoniemen: ["tel", "phone"] },
          { key: "score", label: "Score" },
          { key: "verwachte_waarde", label: "Verwachte waarde", synoniemen: ["waarde", "value"] },
        ]}
      />

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
        uit in de Supabase SQL Editor.
      </p>
    </div>
  );
}
