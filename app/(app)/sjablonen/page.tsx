import Link from "next/link";
import { Plus, Trash2, Download } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { GroteEditor } from "@/components/GroteEditor";
import { createClient } from "@/lib/supabase/server";
import {
  SJABLOON_TYPES,
  sjabloonTypeLabel,
  type Sjabloon,
  type SjabloonType,
} from "@/lib/sjablonen";
import { leesFout } from "@/lib/fout";
import { maakSjabloon, werkSjabloonBij, verwijderSjabloon, importeerStandaard } from "./acties";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function SjablonenPagina({
  searchParams,
}: {
  searchParams: {
    type?: string;
    id?: string;
    nieuw?: string;
    fout?: string;
    opgeslagen?: string;
    geimporteerd?: string;
  };
}) {
  const supabase = createClient();
  const geldig = SJABLOON_TYPES.map((t) => t.key);
  const type = (geldig.includes(searchParams.type as SjabloonType)
    ? searchParams.type
    : "email") as SjabloonType;

  let sjablonen: Sjabloon[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("sjablonen")
      .select("*")
      .eq("type", type)
      .order("naam");
    if (error) throw error;
    sjablonen = (data ?? []) as Sjabloon[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const bewerken = searchParams.id
    ? sjablonen.find((s) => s.id === searchParams.id) ?? null
    : null;
  const nieuw = searchParams.nieuw === "1";
  const isEmail = type === "email";

  return (
    <>
      <PaginaKop
        titel="Sjablonen"
        omschrijving="Beheer herbruikbare sjablonen voor e-mail, offertes en audits."
        actie={
          <form action={importeerStandaard}>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
              <Download size={16} /> Standaard importeren
            </button>
          </form>
        }
      />

      {/* Type-tabs */}
      <div className="mb-6 flex flex-wrap gap-1">
        {SJABLOON_TYPES.map((t) => (
          <Link
            key={t.key}
            href={`/sjablonen?type=${t.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              t.key === type ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Sjabloon opgeslagen.</p>
      )}
      {searchParams.geimporteerd && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {searchParams.geimporteerd} standaardsjablonen geïmporteerd.
        </p>
      )}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">{searchParams.fout}</p>
      )}

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0032_sjablonen.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>}
        </div>
      ) : bewerken || nieuw ? (
        // ---- Bewerk-/nieuw-formulier ----
        <form
          action={bewerken ? werkSjabloonBij.bind(null, bewerken.id, type) : maakSjabloon}
          className="space-y-3"
        >
          <input type="hidden" name="type" value={type} />
          <div className="flex items-center justify-between">
            <Link href={`/sjablonen?type=${type}`} className="text-sm text-navy/60 hover:underline">
              ← Terug naar {sjabloonTypeLabel(type).toLowerCase()}-sjablonen
            </Link>
            {bewerken && <VerwijderKnop id={bewerken.id} type={type} />}
          </div>
          <input
            name="naam"
            required
            defaultValue={bewerken?.naam ?? ""}
            placeholder="Naam van het sjabloon *"
            className={inputCls}
          />
          {isEmail && (
            <input
              name="onderwerp"
              defaultValue={bewerken?.onderwerp ?? ""}
              placeholder="Onderwerp (mag {{bedrijf}} bevatten)"
              className={inputCls}
            />
          )}
          <GroteEditor naamHtml="inhoud_html" beginHtml={bewerken?.inhoud_html ?? ""} minHoogte={360} />
          <button
            type="submit"
            className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
          >
            Opslaan
          </button>
        </form>
      ) : (
        // ---- Lijst ----
        <>
          <div className="mb-4">
            <Link
              href={`/sjablonen?type=${type}&nieuw=1`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              <Plus size={16} /> Nieuw {sjabloonTypeLabel(type).toLowerCase()}-sjabloon
            </Link>
          </div>
          {sjablonen.length === 0 ? (
            <LegeStaat
              titel="Nog geen sjablonen"
              omschrijving="Maak een nieuw sjabloon of importeer de standaardsjablonen."
            />
          ) : (
            <Kaart className="p-0">
              <ul>
                {sjablonen.map((s, i) => (
                  <li
                    key={s.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 ${
                      i > 0 ? "border-t border-navy/10" : ""
                    }`}
                  >
                    <Link
                      href={`/sjablonen?type=${type}&id=${s.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium text-navy hover:underline"
                    >
                      {s.naam}
                      {s.onderwerp && (
                        <span className="ml-2 truncate font-normal text-navy/40">{s.onderwerp}</span>
                      )}
                    </Link>
                    <VerwijderKnop id={s.id} type={type} />
                  </li>
                ))}
              </ul>
            </Kaart>
          )}
        </>
      )}
    </>
  );
}

function VerwijderKnop({ id, type }: { id: string; type: SjabloonType }) {
  return (
    <form action={verwijderSjabloon.bind(null, id, type)}>
      <button
        className="inline-flex items-center gap-1 text-sm text-navy/40 hover:text-red-500"
        title="Verwijderen"
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
