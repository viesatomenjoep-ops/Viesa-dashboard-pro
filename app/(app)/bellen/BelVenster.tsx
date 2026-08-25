"use client";

import { useState } from "react";
import { CalendarClock, PhoneOff, ScrollText, StickyNote } from "lucide-react";
import { BEL_UITKOMSTEN, type BelUitkomst } from "@/lib/activiteiten";
import { vulVariabelen, type VariabeleContext } from "@/lib/variabelen";

export type BelscriptOptie = {
  id: string;
  naam: string;
  /** Doel van het gesprek (het `onderwerp`-veld van het sjabloon). */
  onderwerp: string | null;
  inhoud_html: string;
};

/**
 * Het gespreksvenster op de bellijst: links het belscript om mee te lezen,
 * rechts het afrondformulier (uitkomst, notitie, follow-up).
 *
 * Alles gaat in één keer weg via `legGesprekVast`, zodat een gesprek nooit
 * ongelogd blijft omdat je twee formulieren moest invullen.
 */
export function BelVenster({
  leadId,
  context,
  scripts,
  legVastActie,
}: {
  leadId: string;
  context: VariabeleContext;
  scripts: BelscriptOptie[];
  legVastActie: (leadId: string, formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scriptId, setScriptId] = useState("");
  const [uitkomst, setUitkomst] = useState<BelUitkomst | "">("");

  const script = scripts.find((s) => s.id === scriptId) ?? null;
  const gekozen = BEL_UITKOMSTEN.find((u) => u.key === uitkomst) ?? null;

  /** Datum over n dagen als yyyy-mm-dd, voor de snelknoppen. */
  function overDagen(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  const [followup, setFollowup] = useState("");

  function kiesUitkomst(u: BelUitkomst) {
    setUitkomst(u);
    // Meteen een passende follow-updatum voorstellen; je kunt 'm altijd wijzigen.
    const meta = BEL_UITKOMSTEN.find((x) => x.key === u);
    setFollowup(meta?.followupNaDagen ? overDagen(meta.followupNaDagen) : "");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5"
      >
        <ScrollText size={14} /> Gesprek voeren
      </button>
    );
  }

  return (
    <form
      action={legVastActie.bind(null, leadId)}
      className="mt-3 grid gap-4 rounded-lg border border-navy/10 bg-achtergrond p-4 lg:grid-cols-2"
    >
      {/* Links: het script om mee te lezen */}
      <div className="min-w-0">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-navy/50">
          <ScrollText size={12} /> Belscript
        </label>
        <select
          value={scriptId}
          onChange={(e) => setScriptId(e.target.value)}
          className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Kies een script…</option>
          {scripts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.naam}
            </option>
          ))}
        </select>

        {script ? (
          <div className="mt-2 rounded-lg border border-navy/10 bg-white p-3">
            {script.onderwerp && (
              <p className="mb-2 border-b border-navy/5 pb-2 text-xs font-medium text-navy/60">
                Doel: {vulVariabelen(script.onderwerp, context, false)}
              </p>
            )}
            <div
              className="prose-viesa max-h-80 overflow-y-auto text-sm text-navy"
              dangerouslySetInnerHTML={{
                __html: vulVariabelen(script.inhoud_html, context),
              }}
            />
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-navy/15 p-3 text-xs text-navy/40">
            {scripts.length === 0
              ? "Nog geen belscripts. Importeer ze op /sjablonen met “Standaard importeren”."
              : "Kies een script — de gegevens van deze lead worden er automatisch in gezet."}
          </p>
        )}
      </div>

      {/* Rechts: het gesprek afronden */}
      <div className="flex min-w-0 flex-col">
        <label className="mb-1.5 text-xs font-medium text-navy/50">
          Hoe liep het gesprek?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {BEL_UITKOMSTEN.map((u) => (
            <button
              key={u.key}
              type="button"
              onClick={() => kiesUitkomst(u.key)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                uitkomst === u.key
                  ? "border-navy bg-navy text-white"
                  : "border-navy/15 text-navy/70 hover:bg-navy/5"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="uitkomst" value={uitkomst} />

        <label className="mb-1 mt-3 flex items-center gap-1.5 text-xs font-medium text-navy/50">
          <StickyNote size={12} /> Wat is er gezegd?
        </label>
        <textarea
          name="notitie"
          rows={4}
          placeholder="Waar loopt het bij hen vast? Wat is afgesproken? Wie beslist er mee?"
          className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />

        <label className="mb-1 mt-3 flex items-center gap-1.5 text-xs font-medium text-navy/50">
          <CalendarClock size={12} /> Wanneer terugbellen?
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            name="follow_up_datum"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm text-navy outline-none focus:border-navy"
          />
          {[
            { label: "morgen", dagen: 1 },
            { label: "+3 dagen", dagen: 3 },
            { label: "+1 week", dagen: 7 },
            { label: "+1 maand", dagen: 30 },
          ].map((k) => (
            <button
              key={k.dagen}
              type="button"
              onClick={() => setFollowup(overDagen(k.dagen))}
              className="rounded-lg border border-navy/15 px-2 py-1 text-xs text-navy/70 hover:bg-navy/5"
            >
              {k.label}
            </button>
          ))}
          {followup && (
            <button
              type="button"
              onClick={() => setFollowup("")}
              title="Geen follow-up"
              className="rounded-lg border border-navy/15 p-1.5 text-navy/40 hover:bg-navy/5"
            >
              <PhoneOff size={13} />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-navy/5 pt-3">
          <button
            type="submit"
            disabled={!uitkomst}
            className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-40"
          >
            Gesprek vastleggen
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy/60 hover:bg-navy/5"
          >
            Annuleren
          </button>
          {gekozen && (
            <span className="text-xs text-navy/40">
              {gekozen.blijftOpLijst ? "blijft op de bellijst" : "gaat van de bellijst af"}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
