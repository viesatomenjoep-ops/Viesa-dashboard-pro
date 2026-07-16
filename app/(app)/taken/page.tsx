import { CheckCircle2, Clock, KanbanSquare, ListTodo, Loader, Plus } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { VolScherm } from "@/components/ui/VolScherm";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  TAAK_PERSONEN,
  TAAK_PERIODES,
  TAAK_PRIORITEITEN,
  type Taak,
} from "@/lib/taken";
import { maakTaak } from "./acties";
import { TakenKanban } from "./TakenKanban";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function TakenPagina({
  searchParams,
}: {
  searchParams: { taak?: string; taakfout?: string };
}) {
  const supabase = createClient();
  let taken: Taak[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("taken")
      .select("*, klanten(bedrijf)")
      .order("positie", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    taken = ((data ?? []) as (Taak & { klanten?: { bedrijf?: string } | null })[]).map((r) => ({
      ...r,
      klant_naam: r.klanten?.bedrijf ?? null,
    }));
  } catch {
    schemaOntbreekt = true;
  }

  let klantOpties: { id: string; bedrijf: string }[] = [];
  try {
    const { data } = await supabase.from("klanten").select("id, bedrijf").order("bedrijf");
    klantOpties = (data ?? []) as { id: string; bedrijf: string }[];
  } catch {
    /* klanten-tabel nog niet aanwezig */
  }

  const tel = (s: Taak["status"]) => taken.filter((t) => t.status === s).length;

  return (
    <>
      <PaginaKop
        titel="Taken"
        omschrijving="Sleep taken tussen de kolommen om de status bij te werken."
      />

      {searchParams.taak && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Taak opgeslagen.
        </p>
      )}
      {searchParams.taakfout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.taakfout}
        </p>
      )}

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKaart label="Te doen" waarde={String(tel("todo"))} icoon={ListTodo} toon="blauw" />
        <StatKaart label="Bezig" waarde={String(tel("bezig"))} icoon={Loader} toon="amber" />
        <StatKaart label="Review" waarde={String(tel("review"))} icoon={Clock} toon="paars" />
        <StatKaart label="Klaar" waarde={String(tel("klaar"))} icoon={CheckCircle2} toon="groen" />
      </section>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0029_taken_kanban.sql uit in de Supabase SQL Editor.</p>
        </div>
      ) : (
        <>
          {/* Onder de vier tegels: knoppen. De takenmanager (sleepbaar) opent vol scherm. */}
          <div className="flex flex-wrap gap-2">
            <VolScherm
              label="Open de takenmanager"
              titel="Takenmanager — sleep tussen de kolommen"
              breed="vol"
              toon="navy"
              icoon={<KanbanSquare size={16} />}
            >
              {taken.length === 0 ? (
                <LegeStaat titel="Nog geen taken" omschrijving="Voeg een taak toe met de knop hiernaast." />
              ) : (
                <TakenKanban taken={taken} />
              )}
            </VolScherm>

            <VolScherm label="Nieuwe taak" titel="Nieuwe taak" icoon={<Plus size={16} />}>
              <form action={maakTaak} className="space-y-3">
                <input type="hidden" name="terug" value="/taken" />
                <input name="titel" required placeholder="Nieuwe taak *" className={`${inputCls} w-full`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="wie" defaultValue="algemeen" className={`${inputCls} w-full`}>
                    {TAAK_PERSONEN.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select name="prioriteit" defaultValue="normaal" className={`${inputCls} w-full`}>
                    {TAAK_PRIORITEITEN.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select name="periode" defaultValue="week" className={`${inputCls} w-full`}>
                    {TAAK_PERIODES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select name="klant_id" defaultValue="" className={`${inputCls} w-full`}>
                    <option value="">Geen klant</option>
                    {klantOpties.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.bedrijf}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Taak toevoegen
                </button>
              </form>
            </VolScherm>
          </div>
        </>
      )}
    </>
  );
}
