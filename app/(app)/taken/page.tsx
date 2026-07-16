import { CheckCircle2, Clock, ListTodo, Loader } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
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

export default async function TakenPagina() {
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

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKaart label="Te doen" waarde={String(tel("todo"))} icoon={ListTodo} toon="blauw" />
        <StatKaart label="Bezig" waarde={String(tel("bezig"))} icoon={Loader} toon="amber" />
        <StatKaart label="Review" waarde={String(tel("review"))} icoon={Clock} toon="paars" />
        <StatKaart label="Klaar" waarde={String(tel("klaar"))} icoon={CheckCircle2} toon="groen" />
      </section>

      {/* Snel een taak toevoegen */}
      <form
        action={maakTaak}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
      >
        <input name="titel" required placeholder="Nieuwe taak *" className={inputCls} />
        <select name="wie" defaultValue="algemeen" className={inputCls}>
          {TAAK_PERSONEN.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <select name="prioriteit" defaultValue="normaal" className={inputCls}>
          {TAAK_PRIORITEITEN.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <select name="periode" defaultValue="week" className={inputCls}>
          {TAAK_PERIODES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <select name="klant_id" defaultValue="" className={inputCls}>
          <option value="">Geen klant</option>
          {klantOpties.map((k) => (
            <option key={k.id} value={k.id}>
              {k.bedrijf}
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
          <p className="mt-1 text-navy/70">Voer 0029_taken_kanban.sql uit in de Supabase SQL Editor.</p>
        </div>
      ) : taken.length === 0 ? (
        <LegeStaat titel="Nog geen taken" omschrijving="Voeg hierboven je eerste taak toe." />
      ) : (
        <TakenKanban taken={taken} />
      )}
    </>
  );
}
