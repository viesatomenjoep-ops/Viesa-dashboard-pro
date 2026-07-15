"use client";

import { useState } from "react";
import Link from "next/link";
import { Kaart } from "@/components/ui/Kaart";
import {
  TAAK_PERSONEN,
  TAAK_PERIODES,
  type Taak,
  type TaakPeriode,
  type TaakWie,
} from "@/lib/taken";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * To-do lijst met tabs per persoon (Tom/Joep/Algemeen) en filter op periode
 * (week/maand/jaar). Toevoegen, afvinken en verwijderen.
 */
export function TakenLijst({
  taken,
  klanten = [],
  maakActie,
  wisselActie,
  verwijderActie,
}: {
  taken: Taak[];
  klanten?: { id: string; bedrijf: string }[];
  maakActie: (formData: FormData) => void;
  wisselActie: (id: string, klaar: boolean) => void;
  verwijderActie: (id: string) => void;
}) {
  const [wie, setWie] = useState<TaakWie>("tom");
  const [periode, setPeriode] = useState<TaakPeriode>("week");

  const zichtbaar = taken.filter((t) => t.wie === wie && t.periode === periode);
  const open = zichtbaar.filter((t) => !t.klaar);
  const klaar = zichtbaar.filter((t) => t.klaar);

  return (
    <Kaart>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-navy">To-do lijst</h2>
      </div>

      {/* Persoon-tabs */}
      <div className="mb-2 flex gap-1">
        {TAAK_PERSONEN.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setWie(p.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              wie === p.key ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Periode-tabs */}
      <div className="mb-4 flex gap-1">
        {TAAK_PERIODES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriode(p.key)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              periode === p.key
                ? "bg-oranje/10 text-oranje"
                : "text-navy/50 hover:bg-navy/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Toevoegen */}
      <form action={maakActie} className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="wie" value={wie} />
        <input type="hidden" name="periode" value={periode} />
        <input
          name="titel"
          required
          placeholder="Nieuwe taak…"
          className={`${inputCls} min-w-[8rem] flex-1`}
        />
        {klanten.length > 0 && (
          <select name="klant_id" defaultValue="" className={inputCls} aria-label="Koppel aan klant">
            <option value="">Geen klant</option>
            {klanten.map((k) => (
              <option key={k.id} value={k.id}>
                {k.bedrijf}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Taak
        </button>
      </form>

      {zichtbaar.length === 0 ? (
        <p className="text-sm text-navy/50">Geen taken voor deze selectie.</p>
      ) : (
        <ul className="space-y-1">
          {[...open, ...klaar].map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-navy/[0.02]"
            >
              <form action={wisselActie.bind(null, t.id, !t.klaar)} className="flex">
                <button
                  type="submit"
                  aria-label={t.klaar ? "Ongedaan maken" : "Afvinken"}
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    t.klaar
                      ? "border-oranje bg-oranje text-white"
                      : "border-navy/30 text-transparent hover:border-navy"
                  }`}
                >
                  ✓
                </button>
              </form>
              <span
                className={`flex-1 text-sm ${
                  t.klaar ? "text-navy/40 line-through" : "text-navy"
                }`}
              >
                {t.titel}
              </span>
              {t.klant_id && t.klant_naam && (
                <Link
                  href={`/klanten/${t.klant_id}`}
                  className="max-w-[8rem] truncate rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/60 hover:text-navy"
                >
                  {t.klant_naam}
                </Link>
              )}
              {t.deadline && (
                <span className="text-xs text-navy/40">{t.deadline}</span>
              )}
              <form action={verwijderActie.bind(null, t.id)} className="flex">
                <button type="submit" className="text-navy/30 hover:text-red-500">×</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  );
}
