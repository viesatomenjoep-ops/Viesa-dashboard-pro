"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Check, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { datumKort } from "@/lib/format";
import { dagenTeLaat, overDagen, type Followup } from "@/lib/followups";
import { rondAfEnPlanVolgende, rondFollowupAf, verzetFollowup } from "./acties";

const VERZET_KNOPPEN = [
  { label: "morgen", dagen: 1 },
  { label: "+3 dgn", dagen: 3 },
  { label: "+1 wk", dagen: 7 },
  { label: "+1 mnd", dagen: 30 },
];

/**
 * Eén follow-up in het overzicht.
 *
 * Drie handelingen, en de middelste is de belangrijkste:
 *  - **Verzetten** — schuift alleen de datum op. Zei iemand "bel me volgende
 *    maand", dan hoor je de follow-up niet af te ronden alsof er contact was.
 *  - **Afronden met vervolg** — rondt af én zet meteen de volgende afspraak.
 *    Zonder dat valt de lead uit de cyclus zonder dat iemand het merkt.
 *  - **Alleen afronden** — bewust stoppen met deze lead.
 */
export function FollowupRij({ f }: { f: Followup }) {
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();
  const teLaat = dagenTeLaat(f.follow_up_datum);

  function verzet(dagen: number) {
    setFout(null);
    start(async () => {
      const r = await verzetFollowup(f.id, overDagen(dagen));
      if (!r.ok) setFout(r.fout ?? "Verzetten mislukt.");
    });
  }

  function afronden(formData: FormData) {
    setFout(null);
    start(async () => {
      const r = await rondAfEnPlanVolgende(f.id, formData);
      if (!r.ok) setFout(r.fout ?? "Afronden mislukt.");
      else setOpen(false);
    });
  }

  function alleenAfronden() {
    setFout(null);
    start(async () => {
      const r = await rondFollowupAf(f.id);
      if (!r.ok) setFout(r.fout ?? "Afronden mislukt.");
    });
  }

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {f.lead_id ? (
              <Link
                href={`/leads/${f.lead_id}`}
                className="truncate text-sm font-medium text-navy hover:underline"
              >
                {f.bedrijf ?? "Onbekende lead"}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium text-navy">
                {f.bedrijf ?? "Losse follow-up"}
              </span>
            )}
            {teLaat > 0 ? (
              <Badge toon="amber">
                {teLaat} {teLaat === 1 ? "dag" : "dagen"} te laat
              </Badge>
            ) : (
              f.follow_up_datum && (
                <span className="text-xs text-navy/40">
                  {datumKort(f.follow_up_datum)}
                </span>
              )
            )}
          </div>
          {f.titel && <p className="mt-0.5 text-xs text-navy/60">{f.titel}</p>}
          {f.omschrijving && (
            <p className="mt-0.5 line-clamp-2 text-xs text-navy/45">{f.omschrijving}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {f.telefoon && (
            <a
              href={`tel:${f.telefoon.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1.5 text-xs font-medium text-white hover:bg-navy/90"
            >
              <Phone size={13} /> Bellen
            </a>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={bezig}
            className="inline-flex items-center gap-1 rounded-lg border border-navy/15 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
          >
            <Check size={13} /> Afronden
          </button>
        </div>
      </div>

      {/* Verzetten — schuift alleen de datum op */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs text-navy/40">
          <CalendarClock size={12} /> Verzetten:
        </span>
        {VERZET_KNOPPEN.map((k) => (
          <button
            key={k.dagen}
            type="button"
            onClick={() => verzet(k.dagen)}
            disabled={bezig}
            className="rounded-lg border border-navy/15 px-2 py-0.5 text-xs text-navy/70 hover:bg-navy/5 disabled:opacity-50"
          >
            {k.label}
          </button>
        ))}
        <input
          type="date"
          disabled={bezig}
          onChange={(e) => {
            const d = e.target.value;
            if (!d) return;
            setFout(null);
            start(async () => {
              const r = await verzetFollowup(f.id, d);
              if (!r.ok) setFout(r.fout ?? "Verzetten mislukt.");
            });
          }}
          className="rounded-lg border border-navy/15 px-2 py-0.5 text-xs text-navy/70"
        />
      </div>

      {/* Afronden, met de vervolgafspraak er direct bij */}
      {open && (
        <form action={afronden} className="mt-3 rounded-lg border border-navy/10 bg-achtergrond p-3">
          <label className="mb-1 block text-xs font-medium text-navy/60">
            Wat is er gebeurd? (optioneel)
          </label>
          <textarea
            name="notitie"
            rows={2}
            placeholder="Kort — dit komt in het activiteitenlog van de lead."
            className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />

          <label className="mb-1 mt-3 block text-xs font-medium text-navy/60">
            Volgende afspraak
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              name="vervolg_datum"
              defaultValue={overDagen(14)}
              className="rounded-lg border border-navy/15 px-2.5 py-1.5 text-sm text-navy outline-none focus:border-navy"
            />
            <span className="text-xs text-navy/40">
              Leeg laten = deze lead voorlopig loslaten.
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={bezig}
              className="rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-50"
            >
              Afronden en volgende plannen
            </button>
            <button
              type="button"
              onClick={alleenAfronden}
              disabled={bezig}
              className="rounded-lg border border-navy/15 px-3 py-1.5 text-sm text-navy/70 hover:bg-navy/5 disabled:opacity-50"
            >
              Alleen afronden
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-navy/40 hover:bg-navy/5"
              aria-label="Sluiten"
            >
              <X size={14} />
            </button>
          </div>
        </form>
      )}

      {fout && <p className="mt-2 text-xs text-oranje">{fout}</p>}
    </li>
  );
}
