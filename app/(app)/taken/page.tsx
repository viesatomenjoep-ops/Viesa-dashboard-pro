import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  isVandaagOfAchterstallig,
  prioriteitToon,
  PRIORITEITEN,
  type Taak,
} from "@/lib/taken";
import { datumKort } from "@/lib/format";
import { maakTaak, rondAf, heropen, verwijderTaak } from "./acties";

async function haalTaken(): Promise<{ taken: Taak[]; schemaOntbreekt: boolean }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("taken")
      .select("*")
      .order("vervaldatum", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { taken: (data ?? []) as Taak[], schemaOntbreekt: false };
  } catch {
    return { taken: [], schemaOntbreekt: true };
  }
}

export default async function TakenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const { taken, schemaOntbreekt } = await haalTaken();

  const open = taken.filter((t) => t.status === "open");
  const vandaag = open.filter(isVandaagOfAchterstallig);
  const aankomend = open.filter((t) => !isVandaagOfAchterstallig(t));
  const afgerond = taken.filter((t) => t.status === "afgerond").slice(0, 10);
  const hoog = open.filter((t) => t.prioriteit === "hoog").length;

  return (
    <>
      <PaginaKop
        titel="Taken"
        omschrijving="Follow-ups met datum. Die van vandaag staan ook op het dashboard."
      />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Open taken" waarde={String(open.length)} />
        <KpiKaart
          label="Vandaag & achterstallig"
          waarde={String(vandaag.length)}
          accent={vandaag.length > 0}
        />
        <KpiKaart label="Hoge prioriteit" waarde={String(hoog)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Snel toevoegen */}
      <form
        action={maakTaak}
        className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm"
      >
        <input
          name="titel"
          required
          placeholder="Nieuwe taak *"
          className="min-w-48 flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="vervaldatum"
          type="date"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <select
          name="prioriteit"
          defaultValue="normaal"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          {PRIORITEITEN.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Toevoegen
        </button>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">
            Voer de migraties uit in de Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <TakenGroep titel="Vandaag & achterstallig" taken={vandaag} accent />
          <TakenGroep titel="Aankomend" taken={aankomend} />
          <TakenGroep titel="Recent afgerond" taken={afgerond} afgerondLijst />
        </div>
      )}
    </>
  );
}

function TakenGroep({
  titel,
  taken,
  accent = false,
  afgerondLijst = false,
}: {
  titel: string;
  taken: Taak[];
  accent?: boolean;
  afgerondLijst?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-navy">{titel}</h2>
      {taken.length === 0 ? (
        <LegeStaat titel={afgerondLijst ? "Nog niets afgerond" : "Geen taken"} />
      ) : (
        <Kaart className="p-0">
          <ul>
            {taken.map((taak, i) => (
              <li
                key={taak.id}
                className={`flex items-center gap-3 px-5 py-3 ${
                  i > 0 ? "border-t border-navy/10" : ""
                }`}
              >
                {taak.status === "open" ? (
                  <form action={rondAf.bind(null, taak.id)}>
                    <button
                      type="submit"
                      title="Afronden"
                      className="h-5 w-5 rounded-full border-2 border-navy/30 hover:border-oranje"
                    />
                  </form>
                ) : (
                  <form action={heropen.bind(null, taak.id)}>
                    <button
                      type="submit"
                      title="Heropenen"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white"
                    >
                      ✓
                    </button>
                  </form>
                )}

                <span
                  className={`flex-1 text-sm ${
                    taak.status === "afgerond"
                      ? "text-navy/40 line-through"
                      : "text-navy"
                  }`}
                >
                  {taak.titel}
                </span>

                {taak.vervaldatum && (
                  <span
                    className={`text-xs ${
                      accent ? "font-medium text-oranje" : "text-navy/50"
                    }`}
                  >
                    {datumKort(taak.vervaldatum)}
                  </span>
                )}
                <Badge toon={prioriteitToon(taak.prioriteit)}>
                  {taak.prioriteit}
                </Badge>

                <form action={verwijderTaak.bind(null, taak.id)}>
                  <button
                    type="submit"
                    title="Verwijderen"
                    className="text-navy/30 hover:text-red-500"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </section>
  );
}
