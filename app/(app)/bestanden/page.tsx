import Link from "next/link";
import { Camera, Link2, Tags, Upload } from "lucide-react";
import { VolScherm } from "@/components/ui/VolScherm";
import { uploadBestand } from "./upload-acties";
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
  ADMIN_TYPES,
  adminTypeLabel,
  adminTypeToon,
  filterScans,
  periodePrefix,
  type AdministratieItem,
} from "@/lib/administratie";
import { factuurStatusLabel, factuurStatusToon, type FactuurStatus } from "@/lib/facturen";
import { euro, datumKort } from "@/lib/format";
import { leesFout } from "@/lib/fout";
import { CategorieChips } from "@/components/CategorieChips";
import { CategorieVolScherm } from "@/components/CategorieVolScherm";
import { OpslagMelding } from "@/components/OpslagMelding";
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

type AuditRij = {
  id: string;
  nummer: string;
  titel: string;
  klanten?: { bedrijf?: string } | null;
};

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function BestandenPagina({
  searchParams,
}: {
  searchParams: {
    categorie?: string;
    fout?: string;
    scan?: string;
    geup?: string;
    atype?: string;
    dag?: string;
    maand?: string;
    jaar?: string;
  };
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
  let audits: AuditRij[] = [];
  try {
    const { data } = await supabase
      .from("audits")
      .select("id, nummer, titel, klanten(bedrijf)")
      .order("created_at", { ascending: false })
      .limit(50);
    audits = (data ?? []) as unknown as AuditRij[];
  } catch {
    /* audits-tabel nog niet aanwezig */
  }
  let scans: (AdministratieItem & { download_url?: string | null })[] = [];
  try {
    const { data } = await supabase
      .from("administratie")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    scans = await Promise.all(
      ((data ?? []) as AdministratieItem[]).map(async (r) => {
        let bekijk_url: string | null = null;
        let download_url: string | null = null;
        if (r.drive_file_id) {
          // Nieuw: het bestand staat in Google Drive; via onze proxy bekijken.
          bekijk_url = `/api/administratie/bestand?id=${r.id}`;
          download_url = `/api/administratie/bestand?id=${r.id}&download=1`;
        } else if (r.storage_pad) {
          // Oudere scans (vóór de Drive-omschakeling) staan nog in de bucket.
          const [inline, attachment] = await Promise.all([
            supabase.storage.from("administratie").createSignedUrl(r.storage_pad, 3600),
            supabase.storage
              .from("administratie")
              .createSignedUrl(r.storage_pad, 3600, { download: true }),
          ]);
          bekijk_url = inline.data?.signedUrl ?? null;
          download_url = attachment.data?.signedUrl ?? null;
        }
        return { ...r, bekijk_url, download_url };
      }),
    );
  } catch {
    /* administratie-tabel nog niet aanwezig */
  }

  // Filter op type + periode (dag wint van maand, maand van jaar).
  const atype = (searchParams.atype ?? "").trim();
  const periode = periodePrefix(searchParams);
  const scansGefilterd = filterScans(scans, atype, periode);
  const zipHref = `/api/administratie/download?type=${encodeURIComponent(
    atype,
  )}&periode=${encodeURIComponent(periode)}`;

  const filter = searchParams.categorie;
  const zichtbaar = filter
    ? links.filter((l) => (l.categorie ?? "") === filter)
    : links;

  return (
    <>
      <PaginaKop
        titel="Bestanden"
        omschrijving="Upload bestanden naar Drive of bewaar links — geordend in categorieën."
      />

      <OpslagMelding toon={Boolean(searchParams.geup || searchParams.scan)} tekst="Opgeslagen" />
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Volgorde via flex 'order': toolbar (1) → bestandenlijst (2) → administratie (3) */}
      <div className="flex flex-col gap-6">

      {/* Administratie — staat visueel onderaan */}
      <Kaart className="order-3">
        <div className="mb-1 flex items-center gap-2">
          <Camera size={18} className="text-oranje" />
          <h2 className="text-lg font-semibold text-navy">Administratie Viesa Automations</h2>
        </div>
        <p className="mb-3 text-sm text-navy/60">
          Maak met je camera een foto van een bonnetje, factuur of bestelling.
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

        <h3 className="mb-2 mt-6 text-sm font-medium text-navy">Auditverslagen</h3>
        {audits.length === 0 ? (
          <p className="text-sm text-navy/50">Nog geen auditverslagen.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-navy/10">
            {audits.map((a, i) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm ${
                  i > 0 ? "border-t border-navy/10" : ""
                }`}
              >
                <Link href={`/audits/${a.id}`} className="font-medium text-navy hover:underline">
                  {a.nummer}
                </Link>
                <span className="min-w-0 flex-1 truncate text-navy/60">
                  {a.titel}
                  {a.klanten?.bedrijf ? ` · ${a.klanten.bedrijf}` : ""}
                </span>
                <a
                  href={`/print/audit/${a.id}`}
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

        {/* Filteren op type + dag/maand/jaar (scandatum wordt automatisch vastgelegd) */}
        {scans.length > 0 && (
          <form
            method="get"
            action="/bestanden"
            className="mb-3 flex flex-wrap items-end gap-2"
          >
            <label className="text-xs text-navy/50">
              Type
              <select name="atype" defaultValue={atype} className={`${inputCls} mt-0.5 block`}>
                <option value="">Alles</option>
                {ADMIN_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-navy/50">
              Dag
              <input
                type="date"
                name="dag"
                defaultValue={searchParams.dag ?? ""}
                className={`${inputCls} mt-0.5 block`}
              />
            </label>
            <label className="text-xs text-navy/50">
              Maand
              <input
                type="month"
                name="maand"
                defaultValue={searchParams.maand ?? ""}
                className={`${inputCls} mt-0.5 block`}
              />
            </label>
            <label className="text-xs text-navy/50">
              Jaar
              <input
                type="number"
                name="jaar"
                min="2020"
                max="2100"
                placeholder="2026"
                defaultValue={searchParams.jaar ?? ""}
                className={`${inputCls} mt-0.5 block w-24`}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              Filter
            </button>
            {(atype || periode) && (
              <Link href="/bestanden" className="px-1 py-2 text-sm text-navy/50 hover:underline">
                Wissen
              </Link>
            )}
            {scansGefilterd.length > 0 && (
              <a
                href={zipHref}
                className="ml-auto rounded-lg bg-oranje px-3 py-2 text-sm font-medium text-white hover:bg-oranje/90"
              >
                ↓ Download selectie ({scansGefilterd.length}) als zip
              </a>
            )}
          </form>
        )}

        {scans.length === 0 ? (
          <p className="text-sm text-navy/50">Nog niks gescand — maak hierboven je eerste foto.</p>
        ) : scansGefilterd.length === 0 ? (
          <p className="text-sm text-navy/50">Geen scans in deze selectie — pas het filter aan.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {scansGefilterd.map((s) => (
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
                    <form action={verwijderScan.bind(null, s.id)}>
                      <button className="hover:text-red-500">Verwijderen</button>
                    </form>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] font-medium">
                    {s.download_url && (
                      <a href={s.download_url} className="text-oranje hover:underline">
                        Download
                      </a>
                    )}
                    {s.drive_url && (
                      <a
                        href={s.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-oranje hover:underline"
                      >
                        In Drive
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Kaart>

      {/* Compacte toolbar: uploaden, link toevoegen, categorieën — elk uitklapbaar */}
      <div className="order-1 flex flex-wrap gap-2">
        <VolScherm label="Bestand uploaden" titel="Bestand uploaden naar Drive" icoon={<Upload size={16} />}>
          <form action={uploadBestand} className="space-y-3">
            <input
              type="file"
              name="bestand"
              required
              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy file:mr-3 file:rounded-md file:border-0 file:bg-navy/5 file:px-3 file:py-1.5 file:text-navy"
            />
            <input name="titel" placeholder="Titel (optioneel)" className={`${inputCls} w-full`} />
            <input
              name="categorie"
              list="categorieen-lijst"
              placeholder="Categorie (kies of typ)"
              className={`${inputCls} w-full`}
            />
            <p className="text-xs text-navy/50">
              Het bestand gaat naar de Google Drive van viesatomenjoep@gmail.com. Verbind Drive
              eenmalig via Koppelingen.
            </p>
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Uploaden
            </button>
          </form>
        </VolScherm>

        <VolScherm label="Link toevoegen" titel="Link toevoegen" toon="navy" icoon={<Link2 size={16} />}>
          <form action={voegBestandToe} className="space-y-3">
            <input name="titel" placeholder="Titel" className={`${inputCls} w-full`} />
            <input name="url" type="url" required placeholder="https://… *" className={`${inputCls} w-full`} />
            <select name="type" className={`${inputCls} w-full`}>
              {DRIVE_LINK_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              name="categorie"
              list="categorieen-lijst"
              placeholder="Categorie (kies of typ)"
              className={`${inputCls} w-full`}
            />
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Toevoegen
            </button>
          </form>
        </VolScherm>

        <VolScherm label="Categorieën" titel="Categorieën" toon="navy" icoon={<Tags size={16} />}>
          <form action={maakCategorie} className="mb-4 flex flex-wrap items-center gap-2">
            <input name="naam" placeholder="Nieuwe categorie" className={inputCls} />
            <button
              type="submit"
              className="rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              Categorie opslaan
            </button>
          </form>
          <p className="mb-2 text-sm text-navy/60">
            Filter op categorie (sleep om te ordenen, × om te verwijderen):
          </p>
          <CategorieChips
            categorieen={categorieen}
            actief={filter}
            bewaarVolgordeActie={bewaarCategorieVolgorde}
            verwijderActie={verwijderCategorie}
          />
        </VolScherm>

        <datalist id="categorieen-lijst">
          {categorieen.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="order-2">
      {/* Categorie-chips: tik een categorie → bestanden openen in vol scherm (X sluit) */}
      {!schemaOntbreekt && categorieen.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-sm font-medium text-navy">Open een categorie</p>
          <CategorieVolScherm
            categorieen={categorieen}
            links={links}
            categorieenLijstId="categorieen-lijst"
            bewerkActie={bewerkBestand}
            verwijderActie={verwijderBestand}
          />
        </div>
      )}
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
      </div>
      </div>
    </>
  );
}
