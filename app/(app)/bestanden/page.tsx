import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { BestandRij } from "@/components/BestandRij";
import { createClient } from "@/lib/supabase/server";
import {
  DRIVE_LINK_TYPES,
  STANDAARD_CATEGORIEEN,
  type DriveLink,
} from "@/lib/drivelinks";
import { leesFout } from "@/lib/fout";
import { CategorieChips } from "@/components/CategorieChips";
import {
  voegBestandToe,
  verwijderBestand,
  bewerkBestand,
  maakCategorie,
  bewaarCategorieVolgorde,
  verwijderCategorie,
} from "./acties";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function BestandenPagina({
  searchParams,
}: {
  searchParams: { categorie?: string; fout?: string };
}) {
  const supabase = createClient();
  let links: DriveLink[] = [];
  let bewaard: string[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const [l, c] = await Promise.all([
      supabase
        .from("drive_links")
        .select("*")
        .eq("context_type", "algemeen")
        .order("created_at", { ascending: false }),
      supabase
        .from("bestand_categorieen")
        .select("naam")
        .order("sortering")
        .order("naam"),
    ]);
    if (l.error) throw l.error;
    links = (l.data ?? []) as DriveLink[];
    bewaard = (c.data ?? []).map((x) => x.naam as string);
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  // Standaard- en gebruikte categorieën die nog niet zijn opgeslagen: nu als rij
  // toevoegen zodat ze óók sleep-/verwijderbaar zijn (verschijnen achteraan).
  const gebruikt = links.map((l) => l.categorie).filter(Boolean) as string[];
  const ontbrekend = Array.from(
    new Set([...STANDAARD_CATEGORIEEN, ...gebruikt]),
  ).filter((naam) => !bewaard.includes(naam));
  if (!schemaOntbreekt && ontbrekend.length > 0) {
    await supabase
      .from("bestand_categorieen")
      .upsert(ontbrekend.map((naam) => ({ naam })), {
        onConflict: "naam",
        ignoreDuplicates: true,
      });
  }

  // Opgeslagen volgorde eerst, daarna de zojuist toegevoegde (achteraan).
  const categorieen = [...bewaard, ...ontbrekend];

  const filter = searchParams.categorie;
  const zichtbaar = filter
    ? links.filter((l) => (l.categorie ?? "") === filter)
    : links;

  return (
    <>
      <PaginaKop
        titel="Bestanden"
        omschrijving="Alleen links (Drive, iCloud, Sheets, Docs…) in categorieën — nooit bestanden zelf."
      />

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Link toevoegen (met categorie) */}
      <form
        action={voegBestandToe}
        className="mb-4 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_2fr_1fr_1fr_auto]"
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
          list="categorieen-lijst"
          placeholder="Categorie (kies of typ)"
          className={inputCls}
        />
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Toevoegen
        </button>
        <datalist id="categorieen-lijst">
          {categorieen.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </form>

      {/* Eigen categorie opslaan */}
      <form action={maakCategorie} className="mb-6 flex flex-wrap items-center gap-2">
        <input name="naam" placeholder="Nieuwe categorie" className={inputCls} />
        <button
          type="submit"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Categorie opslaan
        </button>
      </form>

      {/* Categorie-filter — sleepbaar (herorderen) + × om te verwijderen */}
      <CategorieChips
        categorieen={categorieen}
        actief={filter}
        bewaarVolgordeActie={bewaarCategorieVolgorde}
        verwijderActie={verwijderCategorie}
      />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0010_bestand_categorieen.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : zichtbaar.length === 0 ? (
        <LegeStaat titel="Nog geen links" omschrijving="Voeg een link toe en kies een categorie." />
      ) : (
        <Kaart className="p-0">
          <ul>
            {zichtbaar.map((l, i) => (
              <BestandRij
                key={l.id}
                link={l}
                categorieenLijstId="categorieen-lijst"
                bewerkActie={bewerkBestand}
                verwijderActie={verwijderBestand}
                bovenrand={i > 0}
              />
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}
