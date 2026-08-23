import { CheckCircle2, Gauge, MapPin, Phone, PhoneCall, StickyNote } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/server";
import { euro, datumKort } from "@/lib/format";
import { scoreToon, type Lead } from "@/lib/leads";
import { markeerGebeld, bewaarBelNotitie } from "../leads/acties";
import { BelSuggesties } from "./BelSuggesties";
import { haalVanBellijst } from "./acties";

export const dynamic = "force-dynamic";

async function haalBellijst(): Promise<{ leads: Lead[]; schemaOntbreekt: boolean }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("bellen", true)
      .order("score", { ascending: false });
    if (error) throw error;
    return { leads: (data ?? []) as Lead[], schemaOntbreekt: false };
  } catch {
    return { leads: [], schemaOntbreekt: true };
  }
}

function telefoonVan(l: Lead): string | null {
  return l.telefoon_contact || l.telefoon || null;
}

function isVandaag(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default async function BellenPagina() {
  const { leads, schemaOntbreekt } = await haalBellijst();

  const gemScore =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length)
      : 0;
  const lijstWaarde = leads.reduce((s, l) => s + Number(l.verwachte_waarde || 0), 0);

  return (
    <>
      <PaginaKop
        titel="Bellen"
        omschrijving="De leads die we gaan bellen — met AI-suggesties, gesprekspunten en één tik om te bellen."
      />

      {/* KPI's bovenaan */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKaart label="Op de bellijst" waarde={String(leads.length)} icoon={Phone} toon="teal" />
        <StatKaart label="Gem. score" waarde={String(gemScore)} icoon={Gauge} toon="blauw" />
        <StatKaart label="Waarde op lijst" waarde={euro(lijstWaarde)} icoon={PhoneCall} toon="amber" />
        <StatKaart label="Belbaar" waarde={String(leads.filter(telefoonVan).length)} icoon={CheckCircle2} toon="groen" />
      </section>

      {/* AI-suggesties */}
      <div className="mb-8">
        <BelSuggesties />
      </div>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Bellijst nog niet actief</p>
          <p className="mt-1 text-navy/70">
            Voer <code className="rounded bg-navy/5 px-1">0037_bellijst.sql</code> uit in de Supabase SQL Editor.
          </p>
        </div>
      ) : leads.length === 0 ? (
        <LegeStaat
          titel="Nog niemand op de bellijst"
          omschrijving="Laat de AI hierboven suggesties doen, of zet een lead op de lijst via de leadpagina."
        />
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-medium text-navy">Te bellen ({leads.length})</h2>
          <ul className="space-y-3">
            {leads.map((l) => {
              const tel = telefoonVan(l);
              return (
                <li
                  key={l.id}
                  className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar naam={l.bedrijf ?? "?"} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/leads/${l.id}`}
                            className="truncate text-sm font-semibold text-navy hover:underline"
                          >
                            {l.bedrijf}
                          </a>
                          <Badge toon={scoreToon(l.score) === "groen" ? "groen" : scoreToon(l.score) === "oranje" ? "amber" : "grijs"}>
                            score {l.score}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-navy/60">
                          {l.contact_naam && <span>{l.contact_naam}</span>}
                          {l.plaats && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} /> {l.plaats}
                            </span>
                          )}
                          {l.laatst_gebeld && (
                            <span className="text-navy/40">
                              laatst gebeld {datumKort(l.laatst_gebeld)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {tel ? (
                        <a
                          href={`tel:${tel.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90"
                        >
                          <Phone size={15} /> {tel}
                        </a>
                      ) : (
                        <span className="text-xs text-navy/40">geen nummer</span>
                      )}
                      <form action={markeerGebeld.bind(null, l.id)}>
                        <button
                          type="submit"
                          title="Gebeld — van de lijst af"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          <CheckCircle2 size={15} /> Gebeld
                        </button>
                      </form>
                      <form action={haalVanBellijst.bind(null, l.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-navy/15 px-2.5 py-1.5 text-xs font-medium text-navy/60 hover:bg-navy/5"
                        >
                          Van lijst
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Gesprekspunten / bel-notitie, inline te bewerken */}
                  <form
                    action={bewaarBelNotitie.bind(null, l.id)}
                    className="mt-3 border-t border-navy/5 pt-3"
                  >
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-navy/50">
                      <StickyNote size={12} /> Gesprekspunten
                    </label>
                    <textarea
                      name="bel_notitie"
                      defaultValue={l.bel_notitie ?? ""}
                      rows={l.bel_notitie ? 3 : 2}
                      placeholder="Waarover bellen? Bewaar met de knop rechts."
                      className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                    />
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="submit"
                        className="rounded-lg border border-navy/15 px-3 py-1 text-xs font-medium text-navy hover:bg-navy/5"
                      >
                        Notitie bewaren
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
