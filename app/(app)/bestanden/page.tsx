import Link from "next/link";
import { Camera } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { BestandRij } from "@/components/BestandRij";
import { ScanUpload } from "@/components/ScanUpload";
import { createClient } from "@/lib/supabase/server";
import {
  DRIVE_LINK_TYPES,
  STANDAARD_CATEGORIEEN,
  type DriveLink,
} from "@/lib/drivelinks";
import {
  adminTypeLabel,
  adminTypeToon,
  type AdministratieItem,
} from "@/lib/administratie";
import { factuurStatusLabel, factuurStatusToon, type FactuurStatus } from "@/lib/facturen";
import { euro, datumKort } from "@/lib/format";
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
import { voegScanToe, verwijderScan } from "./scan-acties";

type FactuurRij = {
  id: string;
  nummer: string;
  bedrag: number;
  status: FactuurStatus;
  klanten?: { bedrijf?: string } | null;
};

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

  // Administratie: gemaakte facturen + gescande bonnetjes (met bekijk-URL).
  let facturen: FactuurRij[] = [];
  try {
    const { data } = await supabase
      .from("facturen")
      .select("id, nummer, bedrag, status, klanten(bedrijf)")
      .order("factuurdatum", { ascending: false })
      .limit(50);
    facturen = (data ?? []) as unknown as FactuurRij[];
  } catch {
    /* facturen-tabel nog niet aanwezig */
  }
  let scans: AdministratieItem[] = [];
  try {
    const { data } = await supabase
      .from("administratie")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    scans = await Promise.all(
      ((data ?? []) as AdministratieItem[]).map(async (r) => {
        let bekijk_url: string | null = null;
        if (r.storage_pad) {
          const { data: signed } = await supabase.storage
            .from("administratie")
            .createSignedUrl(r.storage_pad, 3600);
          bekijk_url = signed?.signedUrl ?? null;
        }
        return { ...r, bekijk_url };
      }),
    );
  } catch {
    /* administratie-tabel nog niet aanwezig */
  }

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

      {/* Administratie — gemaakte facturen + gescande bonnetjes */}
      <Kaart className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Camera size={18} className="text-oranje" />
          <h2 className="text-lg font-semibold text-navy">Administratie</h2>
        </div>
        <p className="mb-3 text-sm text-navy/60">
          Maak met je camera een foto van een bonnetje, factuur of bestelling — alles staat hier bij elkaar.
        </p>
        <ScanUpload actie={voegScanToe} />

        <h3 className="mb-2 mt-6 text-sm font-medium text-navy">Gemaakte facturen</h3>
        {facturen.length === 0 ? (
          <p className="text-sm text-navy/50">Nog geen facturen.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-navy/10">
            {facturen.map((f, i) => (
              <li
                key={f.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm ${
                  i > 0 ? "border-t border-navy/10" : ""
                }`}
              >
                <Link href={`/facturen/${f.id}`} className="font-medium text-navy hover:underline">
                  {f.nummer}
                </Link>
                <span className="text-navy/60">{f.klanten?.bedrijf ?? "—"}</span>
                <span className="ml-auto font-medium text-navy">{euro(f.bedrag)}</span>
                <Badge toon={factuurStatusToon(f.status)}>{factuurStatusLabel(f.status)}</Badge>
                <a
                  href={`/print/factuur/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-oranje hover:underline"
                >
                  PDF
                </a>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 mt-6 text-sm font-medium text-navy">Gescande bonnetjes &amp; facturen</h3>
        {scans.length === 0 ? (
          <p className="text-sm text-navy/50">Nog niks gescand — maak hierboven je eerste foto.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {scans.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-lg border border-navy/10">
                <a
                  href={s.bekijk_url ?? s.drive_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-[4/3] bg-navy/5"
                >
                  {s.bekijk_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.bekijk_url}
                      alt={s.omschrijving ?? "scan"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-navy/40">
                      Geen preview
                    </div>
                  )}
                </a>
                <div className="p-2">
                  <div className="flex items-center gap-1.5">
                    <Badge toon={adminTypeToon(s.type)}>{adminTypeLabel(s.type)}</Badge>
                    {s.bedrag != null && <span className="text-xs text-navy/60">{euro(s.bedrag)}</span>}
                  </div>
                  {s.omschrijving && (
                    <p className="mt-1 truncate text-xs text-navy/70">{s.omschrijving}</p>
                  )}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-navy/40">
                    <span>{datumKort(s.created_at)}</span>
                    <form action={verwijderScan.bind(null, s.id, s.storage_pad)}>
                      <button className="hover:text-red-500">Verwijderen</button>
                    </form>
                  </div>
                  {s.drive_url && (
                    <a
                      href={s.drive_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-oranje hover:underline"
                    >
                      In Drive
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Kaart>

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
