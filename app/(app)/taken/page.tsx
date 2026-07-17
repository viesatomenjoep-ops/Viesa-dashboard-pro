import { KanbanSquare, Plus } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { VolScherm } from "@/components/ui/VolScherm";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { OpslagMelding } from "@/components/OpslagMelding";
import { TakenOverzicht } from "@/components/TakenOverzicht";
import { createClient } from "@/lib/supabase/server";
import {
  TAAK_PERSONEN,
  TAAK_PERIODES,
  TAAK_PRIORITEITEN,
  type Taak,
} from "@/lib/taken";
import { maakTaak, bewerkTaak, verwijderTaak } from "./acties";
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

  return (
    <>
      <PaginaKop titel="Taken" />

      <OpslagMelding toon={Boolean(searchParams.taak)} tekst="Taak opgeslagen" />
      {searchParams.taakfout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.taakfout}
        </p>
      )}

      {/* Persoonsfilter + vier status-tegels met een mini top-3. */}
      {!schemaOntbreekt && (
        <div className="mb-8">
          <TakenOverzicht taken={taken} bewerkActie={bewerkTaak} verwijderActie={verwijderTaak} />
        </div>
      )}

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
              titel="Takenmanager — sleep of dubbelklik"
              breed="vol"
              toon="navy"
              icoon={<KanbanSquare size={20} />}
              knopKlasse="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/25 bg-white px-5 py-3 text-base font-semibold text-navy shadow-sm hover:bg-navy/5"
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
