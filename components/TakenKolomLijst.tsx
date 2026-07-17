"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
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
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * Takenlijst voor in een vol scherm (per kolom). Tik op een taak → die opent
 * volledig scherm om te verwerken/bewerken (X sluit). Verwijderen kan met de
 * prullenbak (met bevestiging).
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
  const [open, setOpen] = useState<Taak | null>(null);
  const [gemonteerd, setGemonteerd] = useState(false);

  useEffect(() => setGemonteerd(true), []);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", h);
    };
  }, [open]);

  function verwijder(id: string) {
    if (!window.confirm("Weet je zeker dat je deze taak wilt verwijderen?")) return;
    void verwijderActie(id);
    setOpen(null);
  }

  if (taken.length === 0) {
    return <LegeStaat titel="Geen taken" omschrijving="Er staan hier geen taken in deze kolom." />;
  }

  return (
    <>
      <Kaart className="p-0">
        <ul>
          {taken.map((t, i) => (
            <li key={t.id} className={i > 0 ? "border-t border-navy/10" : ""}>
              <div className="flex items-center gap-3">
                {/* Tik opent het vol scherm; wordt donkerder bij indrukken. */}
                <button
                  type="button"
                  onClick={() => setOpen(t)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-navy/[0.03] active:bg-navy/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{t.titel}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge toon={prioriteitToon(t.prioriteit)}>{prioriteitLabel(t.prioriteit)}</Badge>
                      {t.klant_naam && <span className="text-xs text-navy/50">{t.klant_naam}</span>}
                    </div>
                  </div>
                </button>
                <form
                  action={verwijderActie.bind(null, t.id)}
                  onSubmit={(e) => {
                    if (!window.confirm("Weet je zeker dat je deze taak wilt verwijderen?")) {
                      e.preventDefault();
                    }
                  }}
                  className="pr-3"
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
            </li>
          ))}
        </ul>
      </Kaart>

      {/* Vol scherm om de taak te verwerken/bewerken. */}
      {open &&
        gemonteerd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
            <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
              <h2 className="truncate text-lg font-semibold text-navy">Taak verwerken</h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Sluiten"
                className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                action={bewerkActie}
                onSubmit={() => setOpen(null)}
                className="mx-auto max-w-xl space-y-3"
              >
                <input type="hidden" name="id" value={open.id} />
                <label className="block text-xs font-medium text-navy/50">
                  Taak
                  <input name="titel" defaultValue={open.titel} required className={`${selCls} mt-1`} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-navy/50">
                    Status
                    <select name="status" defaultValue={open.status} className={`${selCls} mt-1`}>
                      {TAAK_STATUSSEN.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-navy/50">
                    Prioriteit
                    <select name="prioriteit" defaultValue={open.prioriteit} className={`${selCls} mt-1`}>
                      {TAAK_PRIORITEITEN.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="submit"
                    className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => verwijder(open.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Verwijderen
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
