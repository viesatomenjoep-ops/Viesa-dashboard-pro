import Link from "next/link";
import { Plus, Trash2, Download } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { VolScherm } from "@/components/ui/VolScherm";
import { OpslagMelding } from "@/components/OpslagMelding";
import { SjabloonRij } from "@/components/SjabloonRij";
import { GroteEditor } from "@/components/GroteEditor";
import { createClient } from "@/lib/supabase/server";
import {
  SJABLOON_TYPES,
  sjabloonTypeLabel,
  sorteerMetFavorietenBovenaan,
  type Sjabloon,
  type SjabloonType,
} from "@/lib/sjablonen";
import { STANDAARD_LETTERTYPE } from "@/lib/lettertypes";
import { leesFout } from "@/lib/fout";
import {
  maakSjabloon,
  werkSjabloonBij,
  verwijderSjabloon,
  importeerStandaard,
  wisselFavoriet,
} from "./acties";

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
    // Favorieten bovenaan, daarbinnen op naam — zelfde volgorde als in de
    // sjabloonkiezer van het mailvenster.
    sjablonen = sorteerMetFavorietenBovenaan((data ?? []) as Sjabloon[]);
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const bewerken = searchParams.id
    ? sjablonen.find((s) => s.id === searchParams.id) ?? null
    : null;
  const nieuw = searchParams.nieuw === "1";
  const isEmail = type === "email";
  const isBelscript = type === "belscript";
  // E-mail gebruikt `onderwerp` als onderwerpregel; een belscript hergebruikt
  // datzelfde veld voor het doel van het gesprek.
  const toonOnderwerp = isEmail || isBelscript;
  const onderwerpPlaceholder = isBelscript
    ? "Doel van het gesprek (bv. afspraak inplannen)"
    : "Onderwerp (mag {{bedrijf}} bevatten)";

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

      <OpslagMelding toon={Boolean(searchParams.opgeslagen)} tekst="Sjabloon opgeslagen" />
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
      ) : bewerken ? (
        // ---- Bewerk-formulier (bestaand sjabloon) ----
        <form action={werkSjabloonBij.bind(null, bewerken.id, type)} className="space-y-3">
          <input type="hidden" name="type" value={type} />
          <div className="flex items-center justify-between">
            <Link href={`/sjablonen?type=${type}`} className="text-sm text-navy/60 hover:underline">
              ← Terug naar {sjabloonTypeLabel(type).toLowerCase()}-sjablonen
            </Link>
            <VerwijderKnop id={bewerken.id} type={type} />
          </div>
          <input
            name="naam"
            required
            defaultValue={bewerken.naam ?? ""}
            placeholder="Naam van het sjabloon *"
            className={inputCls}
          />
          {toonOnderwerp && (
            <input
              name="onderwerp"
              defaultValue={bewerken.onderwerp ?? ""}
              placeholder={onderwerpPlaceholder}
              className={inputCls}
            />
          )}
          <GroteEditor
            naamHtml="inhoud_html"
            beginHtml={bewerken.inhoud_html ?? ""}
            beginLettertype={bewerken.lettertype || STANDAARD_LETTERTYPE}
            lettertypeKiezer={isEmail}
            minHoogte={360}
          />
          <button
            type="submit"
            className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
          >
            Opslaan
          </button>
        </form>
      ) : (
        // ---- Lijst + "nieuw" opent de editor in vol scherm ----
        <>
          <div className="mb-4">
            <VolScherm
              label={`Nieuw ${sjabloonTypeLabel(type).toLowerCase()}-sjabloon`}
              titel={`Nieuw ${sjabloonTypeLabel(type).toLowerCase()}-sjabloon`}
              breed="vol"
              standaardOpen={nieuw}
              icoon={<Plus size={16} />}
            >
              <form action={maakSjabloon} className="space-y-3">
                <input type="hidden" name="type" value={type} />
                <input
                  name="naam"
                  required
                  placeholder="Naam van het sjabloon *"
                  className={inputCls}
                />
                {toonOnderwerp && (
                  <input
                    name="onderwerp"
                    placeholder={onderwerpPlaceholder}
                    className={inputCls}
                  />
                )}
                <GroteEditor
                  naamHtml="inhoud_html"
                  lettertypeKiezer={isEmail}
                  minHoogte={360}
                />
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Opslaan
                </button>
              </form>
            </VolScherm>
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
                  <li key={s.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                    <SjabloonRij
                      id={s.id}
                      naam={s.naam}
                      onderwerp={s.onderwerp}
                      type={type}
                      href={`/sjablonen?type=${type}&id=${s.id}`}
                      favoriet={s.favoriet}
                      verwijderActie={verwijderSjabloon}
                      favorietActie={wisselFavoriet}
                    />
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
