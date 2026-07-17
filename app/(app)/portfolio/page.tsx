import { ExternalLink, FileText, ImageIcon, Link2, Plus, Trash2, Upload } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { VolScherm } from "@/components/ui/VolScherm";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { OpslagMelding } from "@/components/OpslagMelding";
import { createClient } from "@/lib/supabase/server";
import { leesFout } from "@/lib/fout";
import { voegPortfolioToe, uploadPortfolio, verwijderPortfolio } from "./acties";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  titel: string;
  url: string;
  type: string;
  mime?: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

function soort(it: Item): "pdf" | "afbeelding" | "website" {
  if (it.type === "pdf" || /\.pdf($|\?)/i.test(it.url)) return "pdf";
  if (it.type === "afbeelding" || (it.mime ?? "").startsWith("image/") || /\.(png|jpe?g|gif|webp)($|\?)/i.test(it.url))
    return "afbeelding";
  return "website";
}

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
      .select("id, titel, url, type, mime, created_at")
      .eq("categorie", "Portfolio")
      .order("created_at", { ascending: false });
    if (error) throw error;
    items = (data ?? []) as Item[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  return (
    <>
      <PaginaKop
        titel="Portfolio"
        omschrijving="Alle websites en projecten die we ooit hebben gedaan — links, PDF's en afbeeldingen."
        actie={
          <div className="flex flex-wrap gap-2">
            <VolScherm label="Link toevoegen" titel="Link toevoegen" toon="navy" icoon={<Link2 size={16} />}>
              <form action={voegPortfolioToe} className="space-y-3">
                <input name="titel" required placeholder="Titel (bijv. Ibiza Mi Vida) *" className={inputCls} />
                <input name="url" required placeholder="https://… (website of PDF) *" className={inputCls} />
                <select name="type" defaultValue="overig" className={inputCls}>
                  <option value="overig">Website</option>
                  <option value="pdf">PDF-link</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Toevoegen
                </button>
              </form>
            </VolScherm>

            <VolScherm label="Uploaden" titel="Bestand uploaden" icoon={<Upload size={16} />}>
              <form action={uploadPortfolio} className="space-y-3">
                <input
                  type="file"
                  name="bestand"
                  required
                  accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy file:mr-3 file:rounded-md file:border-0 file:bg-navy/5 file:px-3 file:py-1.5 file:text-navy"
                />
                <input name="titel" placeholder="Titel (optioneel)" className={inputCls} />
                <p className="text-xs text-navy/50">
                  Afbeeldingen, PDF-bestanden en documenten gaan naar de Google Drive van
                  viesatomenjoep@gmail.com. Verbind Drive eenmalig via Koppelingen.
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Uploaden
                </button>
              </form>
            </VolScherm>
          </div>
        }
      />

      <OpslagMelding toon={Boolean(searchParams.opgeslagen)} tekst="Opgeslagen in portfolio" />
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
          omschrijving="Voeg een link toe of upload een afbeelding/PDF met de knoppen rechtsboven."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const s = soort(it);
            const isImg = s === "afbeelding";
            const isPdf = s === "pdf";
            return (
              <Kaart key={it.id} className="flex flex-col gap-3 p-0">
                {/* Preview: afbeelding = de foto zelf; website = echte screenshot
                    van de homepage (via WordPress mShots, geen sleutel nodig);
                    PDF = icoon. */}
                <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-t-xl bg-navy/5">
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt={it.titel} className="h-full w-full object-cover" />
                  ) : isPdf ? (
                    <FileText size={40} className="text-red-500" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.thum.io/get/width/800/crop/600/${it.url}`}
                      alt={`Voorbeeld van ${it.titel}`}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-navy">{it.titel}</h2>
                      <p className="truncate text-xs text-navy/50">{it.url}</p>
                    </div>
                    <Badge toon={isPdf ? "rood" : isImg ? "paars" : "groen"}>
                      {isPdf ? "PDF" : isImg ? "Beeld" : "Website"}
                    </Badge>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90"
                    >
                      {isImg ? <ImageIcon size={14} /> : <ExternalLink size={14} />} Openen
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
                </div>
              </Kaart>
            );
          })}
        </div>
      )}
    </>
  );
}
