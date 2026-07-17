import { ExternalLink, FileText, Globe, Plus, Trash2 } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { VolScherm } from "@/components/ui/VolScherm";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { OpslagMelding } from "@/components/OpslagMelding";
import { createClient } from "@/lib/supabase/server";
import { leesFout } from "@/lib/fout";
import { voegPortfolioToe, verwijderPortfolio } from "./acties";

export const dynamic = "force-dynamic";

type Item = { id: string; titel: string; url: string; type: string; created_at: string };

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function PortfolioPagina({
  searchParams,
}: {
  searchParams: { fout?: string; opgeslagen?: string };
}) {
  const supabase = createClient();
  let items: Item[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("drive_links")
      .select("id, titel, url, type, created_at")
      .eq("context_type", "portfolio")
      .order("created_at", { ascending: false });
    if (error) throw error;
    items = (data ?? []) as Item[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const isPdf = (it: Item) => it.type === "pdf" || /\.pdf($|\?)/i.test(it.url);

  return (
    <>
      <PaginaKop
        titel="Portfolio"
        omschrijving="Alle websites en projecten die we ooit hebben gedaan — met links en PDF's."
        actie={
          <VolScherm label="Toevoegen" titel="Portfolio-item toevoegen" icoon={<Plus size={16} />}>
            <form action={voegPortfolioToe} className="space-y-3">
              <input name="titel" required placeholder="Titel (bijv. Ibiza Mi Vida) *" className={inputCls} />
              <input name="url" required placeholder="https://… (website of PDF) *" className={inputCls} />
              <select name="type" defaultValue="website" className={inputCls}>
                <option value="website">Website</option>
                <option value="pdf">PDF</option>
                <option value="overig">Overig</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
              >
                Toevoegen
              </button>
            </form>
          </VolScherm>
        }
      />

      <OpslagMelding toon={Boolean(searchParams.opgeslagen)} tekst="Toegevoegd aan portfolio" />
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">{searchParams.fout}</p>
      )}

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de drive_links-migratie uit in de Supabase SQL Editor.</p>
          {foutmelding && <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>}
        </div>
      ) : items.length === 0 ? (
        <LegeStaat
          titel="Nog geen portfolio-items"
          omschrijving="Voeg je eerste website of PDF toe met de knop rechtsboven."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const pdf = isPdf(it);
            return (
              <Kaart key={it.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      pdf ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {pdf ? <FileText size={20} /> : <Globe size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-navy">{it.titel}</h2>
                    <p className="truncate text-xs text-navy/50">{it.url}</p>
                  </div>
                  <Badge toon={pdf ? "rood" : "groen"}>{pdf ? "PDF" : "Website"}</Badge>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90"
                  >
                    <ExternalLink size={14} /> {pdf ? "Open PDF" : "Open website"}
                  </a>
                  <form action={verwijderPortfolio.bind(null, it.id)}>
                    <button
                      type="submit"
                      aria-label="Verwijderen"
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </Kaart>
            );
          })}
        </div>
      )}
    </>
  );
}
