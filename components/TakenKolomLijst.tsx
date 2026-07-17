"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import {
  TAAK_STATUSSEN,
  TAAK_PRIORITEITEN,
  prioriteitToon,
  prioriteitLabel,
  type Taak,
} from "@/lib/taken";

const selCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * Takenlijst voor in een vol scherm (per kolom: Te doen/Bezig/Review/Klaar).
 * Elke taak is te bewerken (titel, status, prioriteit) en te verwijderen met
 * een bevestiging.
 */
export function TakenKolomLijst({
  taken,
  bewerkActie,
  verwijderActie,
}: {
  taken: Taak[];
  bewerkActie: (formData: FormData) => Promise<void>;
  verwijderActie: (id: string) => Promise<void>;
}) {
  const [bewerkt, setBewerkt] = useState<string | null>(null);

  if (taken.length === 0) {
    return <LegeStaat titel="Geen taken" omschrijving="Er staan hier geen taken in deze kolom." />;
  }

  return (
    <Kaart className="p-0">
      <ul>
        {taken.map((t, i) => (
          <li key={t.id} className={i > 0 ? "border-t border-navy/10" : ""}>
            {bewerkt === t.id ? (
              <form action={bewerkActie} onSubmit={() => setBewerkt(null)} className="space-y-2 p-4">
                <input type="hidden" name="id" value={t.id} />
                <input
                  name="titel"
                  defaultValue={t.titel}
                  required
                  className={`${selCls} w-full`}
                  placeholder="Taak *"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select name="status" defaultValue={t.status} className={`${selCls} w-full`}>
                    {TAAK_STATUSSEN.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select name="prioriteit" defaultValue={t.prioriteit} className={`${selCls} w-full`}>
                    {TAAK_PRIORITEITEN.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBewerkt(null)}
                    className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                  >
                    Annuleer
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{t.titel}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge toon={prioriteitToon(t.prioriteit)}>{prioriteitLabel(t.prioriteit)}</Badge>
                    {t.klant_naam && <span className="text-xs text-navy/50">{t.klant_naam}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBewerkt(t.id)}
                  aria-label="Bewerken"
                  className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
                >
                  <Pencil size={15} />
                </button>
                <form
                  action={verwijderActie.bind(null, t.id)}
                  onSubmit={(e) => {
                    if (!window.confirm("Weet je zeker dat je deze taak wilt verwijderen?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <button
                    type="submit"
                    aria-label="Verwijderen"
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Kaart>
  );
}
