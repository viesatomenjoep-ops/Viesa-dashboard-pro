"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Kaart } from "@/components/ui/Kaart";
import { VolScherm } from "@/components/ui/VolScherm";
import { SwipeRij } from "@/components/ui/SwipeRij";
import {
  TAAK_PERSONEN,
  TAAK_PERIODES,
  type Taak,
  type TaakPeriode,
} from "@/lib/taken";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * To-do lijst op het dashboard. Tom, Joep én Algemeen staan tegelijk in beeld
 * (elk een eigen sectie). "Nieuwe taak" is één knop die een volledig scherm
 * opent. Rijen veeg je naar links om te verwijderen (iPhone-stijl).
 */
export function TakenLijst({
  taken,
  klanten = [],
  maakActie,
  wisselActie,
  verwijderActie,
  terug = "/dashboard",
}: {
  taken: Taak[];
  klanten?: { id: string; bedrijf: string }[];
  maakActie: (formData: FormData) => void;
  wisselActie: (id: string, klaar: boolean) => void;
  verwijderActie: (id: string) => void;
  terug?: string;
}) {
  const [periode, setPeriode] = useState<TaakPeriode>("week");

  return (
    <Kaart>
      {/* Kop + één knop voor een nieuwe taak (opent volledig scherm) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-navy">To-do lijst</h2>
        <VolScherm
          label="Nieuwe taak"
          titel="Nieuwe taak"
          icoon={<Plus size={16} />}
        >
          <form action={maakActie} className="space-y-3">
            <input type="hidden" name="terug" value={terug} />
            <input
              name="titel"
              required
              placeholder="Wat moet er gebeuren? *"
              className={`${inputCls} w-full`}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-navy/50">
                Wie
                <select name="wie" defaultValue="algemeen" className={`${inputCls} mt-0.5 block w-full`}>
                  {TAAK_PERSONEN.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-navy/50">
                Periode
                <select name="periode" defaultValue={periode} className={`${inputCls} mt-0.5 block w-full`}>
                  {TAAK_PERIODES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-navy/50">
                Klant
                <select name="klant_id" defaultValue="" className={`${inputCls} mt-0.5 block w-full`}>
                  <option value="">Geen klant</option>
                  {klanten.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.bedrijf}
                    </option>
                  ))}
                </select>
              </label>
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

      {/* Periode-schakelaar (compact) */}
      <div className="mb-4 flex gap-1">
        {TAAK_PERIODES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriode(p.key)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              periode === p.key ? "bg-oranje/10 text-oranje" : "text-navy/50 hover:bg-navy/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tom, Joep én Algemeen tegelijk in beeld — compact */}
      <div className="grid gap-3 md:grid-cols-3">
        {TAAK_PERSONEN.map((persoon) => {
          const rijen = taken.filter((t) => t.wie === persoon.key && t.periode === periode);
          const open = rijen.filter((t) => !t.klaar);
          const klaar = rijen.filter((t) => t.klaar);
          return (
            <div key={persoon.key} className="min-w-0 rounded-xl border border-navy/10 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">{persoon.label}</h3>
                <span className="text-xs text-navy/40">{rijen.length}</span>
              </div>
              {rijen.length === 0 ? (
                <p className="py-1.5 text-xs text-navy/40">Geen taken.</p>
              ) : (
                <ul className="space-y-0.5">
                  {[...open, ...klaar].map((t) => (
                    <li key={t.id}>
                      <SwipeRij onVerwijder={() => verwijderActie(t.id)}>
                        <div className="flex items-center gap-2 py-1.5">
                          <form action={wisselActie.bind(null, t.id, !t.klaar)} className="flex shrink-0">
                            <button
                              type="submit"
                              aria-label={t.klaar ? "Ongedaan maken" : "Afvinken"}
                              className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] ${
                                t.klaar
                                  ? "border-oranje bg-oranje text-white"
                                  : "border-navy/30 text-transparent hover:border-navy"
                              }`}
                            >
                              ✓
                            </button>
                          </form>
                          {/* Korte tekst; tik opent de volledige taak in een groter scherm */}
                          <VolScherm
                            titel="Taak"
                            label={t.titel}
                            knopKlasse={`min-w-0 flex-1 truncate text-left text-sm ${
                              t.klaar ? "text-navy/40 line-through" : "text-navy"
                            }`}
                          >
                            <div className="space-y-4">
                              <p className="text-lg font-medium text-navy">{t.titel}</p>
                              {t.klant_id && t.klant_naam && (
                                <Link
                                  href={`/klanten/${t.klant_id}`}
                                  className="inline-block rounded-full bg-navy/5 px-3 py-1 text-sm text-navy/70 hover:text-navy"
                                >
                                  {t.klant_naam}
                                </Link>
                              )}
                              {t.deadline && (
                                <p className="text-sm text-navy/50">Deadline: {t.deadline}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => wisselActie(t.id, !t.klaar)}
                                  className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                                >
                                  {t.klaar ? "Heropenen" : "Markeer klaar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => verwijderActie(t.id)}
                                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  Verwijderen
                                </button>
                              </div>
                            </div>
                          </VolScherm>
                        </div>
                      </SwipeRij>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-navy/35">
        Tik op een taak voor de volledige tekst, of veeg naar links om te verwijderen.
      </p>
    </Kaart>
  );
}
