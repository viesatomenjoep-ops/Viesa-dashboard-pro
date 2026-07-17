"use client";

import { useState } from "react";
import { LocatieVeld } from "@/components/LocatieVeld";

const veld =
  "w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-base text-navy outline-none focus:border-navy";
const rijCls = "flex items-center justify-between gap-3 py-2.5";

/**
 * Toevoegscherm in iPhone-stijl met twee tabs: Activiteit en Herinnering. In één
 * oogopslag kies je wat je toevoegt. De datum- en tijdvelden zijn native inputs —
 * op iPhone tonen die de vertrouwde iOS-wielselector. "Voeg toe" verstuurt.
 *
 * `sluit` is de kruis-/Annuleer-actie (sluit het vol scherm).
 */
export function AgendaToevoegen({
  maakActie,
  vandaag,
  sluit,
}: {
  maakActie: (formData: FormData) => void;
  vandaag: string; // YYYY-MM-DD
  sluit?: () => void;
}) {
  const [tab, setTab] = useState<"activiteit" | "herinnering">("activiteit");
  const [heleDag, setHeleDag] = useState(false);
  const [tijdAan, setTijdAan] = useState(true);

  return (
    <form action={maakActie} className="mx-auto max-w-xl space-y-5">
      <input type="hidden" name="soort" value={tab} />

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-navy/5 p-1">
        {(["activiteit", "herinnering"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-white text-navy shadow-sm" : "text-navy/60"
            }`}
          >
            {t === "activiteit" ? "Activiteit" : "Herinnering"}
          </button>
        ))}
      </div>

      {/* Naam + (bij activiteit) locatie met echte adres-suggesties */}
      <div className="space-y-2">
        <input
          name="titel"
          required
          placeholder="Naam"
          className={`${veld} rounded-xl border-navy/15`}
        />
        {tab === "activiteit" && <LocatieVeld name="locatie" placeholder="Locatie of videogesprek" />}
      </div>

      {tab === "activiteit" ? (
        <div className="rounded-xl border border-navy/15 bg-white px-3">
          <div className={rijCls}>
            <span className="text-sm font-medium text-navy">Hele dag</span>
            <input
              type="checkbox"
              name="hele_dag"
              checked={heleDag}
              onChange={(e) => setHeleDag(e.target.checked)}
              className="h-6 w-6 accent-oranje"
            />
          </div>
          <div className="border-t border-navy/10">
            <div className={rijCls}>
              <span className="text-sm font-medium text-navy">Begin</span>
              <div className="flex items-center gap-2">
                <input type="date" name="begin_datum" defaultValue={vandaag} className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
                {!heleDag && (
                  <input type="time" name="begin_tijd" defaultValue="09:00" className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
                )}
              </div>
            </div>
            <div className={`${rijCls} border-t border-navy/10`}>
              <span className="text-sm font-medium text-navy">Einde</span>
              <div className="flex items-center gap-2">
                <input type="date" name="eind_datum" defaultValue={vandaag} className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
                {!heleDag && (
                  <input type="time" name="eind_tijd" defaultValue="10:00" className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea name="notities_dummy" placeholder="Notities" rows={2} className={veld} />
          <div className="rounded-xl border border-navy/15 bg-white px-3">
            <div className={rijCls}>
              <span className="text-sm font-medium text-navy">Datum</span>
              <input type="date" name="datum" defaultValue={vandaag} className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
            </div>
            <div className={`${rijCls} border-t border-navy/10`}>
              <span className="text-sm font-medium text-navy">Tijd</span>
              <div className="flex items-center gap-2">
                {tijdAan && (
                  <input type="time" name="tijd" defaultValue="07:00" className="rounded-lg bg-navy/5 px-2 py-1.5 text-sm text-navy" />
                )}
                <input
                  type="checkbox"
                  name="tijd_aan"
                  checked={tijdAan}
                  onChange={(e) => setTijdAan(e.target.checked)}
                  className="h-6 w-6 accent-oranje"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-oranje px-4 py-3 text-sm font-semibold text-white hover:bg-oranje/90"
        >
          Voeg toe
        </button>
        {sluit && (
          <button
            type="button"
            onClick={sluit}
            className="rounded-lg border border-navy/20 px-4 py-3 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Annuleer
          </button>
        )}
      </div>
    </form>
  );
}
