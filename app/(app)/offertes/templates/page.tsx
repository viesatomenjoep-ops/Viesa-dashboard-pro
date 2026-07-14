import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import type { OfferteTemplate } from "@/lib/offertes";
import { maakTemplate, verwijderTemplate } from "../acties";

export default async function TemplatesPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let templates: OfferteTemplate[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("offerte_templates")
      .select("*")
      .order("naam");
    if (error) throw error;
    templates = (data ?? []) as OfferteTemplate[];
  } catch {
    schemaOntbreekt = true;
  }

  return (
    <>
      <div className="mb-6">
        <Link href="/offertes" className="text-sm text-navy/60 hover:underline">
          ← Terug naar offertes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Offerte-templates</h1>
        <p className="mt-1 text-sm text-navy/60">
          Gebruik placeholders als{" "}
          <code className="rounded bg-navy/5 px-1">{"{{bedrijfsnaam}}"}</code>,{" "}
          <code className="rounded bg-navy/5 px-1">{"{{titel}}"}</code> en{" "}
          <code className="rounded bg-navy/5 px-1">{"{{datum}}"}</code>.
        </p>
      </div>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form action={maakTemplate} className="mb-8">
        <Kaart>
          <label className="mb-1 block text-sm font-medium text-navy">Naam</label>
          <input
            name="naam"
            required
            placeholder="Bijv. Standaard automatisering"
            className="mb-4 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <label className="mb-1 block text-sm font-medium text-navy">Inhoud</label>
          <MarkdownEditor naam="inhoud_markdown" hoogte={260} />
          <div className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Template opslaan
            </button>
          </div>
        </Kaart>
      </form>

      {schemaOntbreekt ? null : templates.length === 0 ? (
        <LegeStaat titel="Nog geen templates" />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Kaart key={t.id} className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy">{t.naam}</span>
              <form action={verwijderTemplate.bind(null, t.id)}>
                <button
                  type="submit"
                  className="text-sm text-navy/40 hover:text-red-500"
                >
                  Verwijderen
                </button>
              </form>
            </Kaart>
          ))}
        </div>
      )}
    </>
  );
}
