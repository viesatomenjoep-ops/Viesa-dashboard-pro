"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, KeyRound, Loader2, MinusCircle, XCircle } from "lucide-react";
import type { SleutelStatus } from "@/lib/ai-status";

/**
 * Laat per AI-dienst zien of de sleutel goed in Vercel staat.
 *
 * Bewust achter een knop en niet bij het laden van de pagina: elke controle is
 * een echte aanroep naar de aanbieder, en dat hoort niet te gebeuren telkens als
 * iemand deze pagina opent.
 *
 * De sleutelwaarden komen hier nooit — de server geeft alleen terug of ze
 * werken.
 */
export function SleutelStatusPaneel({
  controleerActie,
}: {
  controleerActie: () => Promise<SleutelStatus[]>;
}) {
  const [statussen, setStatussen] = useState<SleutelStatus[] | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function controleer() {
    setFout(null);
    start(async () => {
      try {
        setStatussen(await controleerActie());
      } catch (e) {
        setFout(e instanceof Error ? e.message : "Controle mislukt.");
      }
    });
  }

  const werkend = statussen?.filter((s) => s.werkt).length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-navy">
            <KeyRound size={15} /> AI-sleutels
          </h3>
          <p className="mt-1 text-xs text-navy/60">
            Controleert of elke sleutel in Vercel staat én werkt. De waarden zelf
            worden nooit getoond.
          </p>
        </div>
        <button
          type="button"
          onClick={controleer}
          disabled={bezig}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
        >
          {bezig ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Controleren…
            </>
          ) : (
            "Sleutels controleren"
          )}
        </button>
      </div>

      {fout && (
        <p className="mt-3 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">{fout}</p>
      )}

      {statussen && (
        <>
          <p className="mt-4 text-xs text-navy/50">
            {werkend} van de {statussen.length} sleutels werkt.
          </p>
          <ul className="mt-2 divide-y divide-navy/5 rounded-lg border border-navy/10">
            {statussen.map((s) => (
              <li key={s.key} className="flex items-start gap-3 px-3 py-2.5">
                <span className="mt-0.5 shrink-0">
                  {s.werkt === true ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : s.werkt === false ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <MinusCircle size={16} className="text-navy/25" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-navy">{s.label}</span>
                    <code className="rounded bg-navy/5 px-1.5 py-0.5 text-xs text-navy/60">
                      {s.key}
                    </code>
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${
                      s.werkt === true ? "text-emerald-700" : "text-navy/60"
                    }`}
                  >
                    {s.melding}
                  </p>
                  {s.werkt !== true && (
                    <p className="mt-0.5 text-xs text-navy/40">
                      {s.gevolg} Ophalen bij: {s.bron}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-navy/40">
            Staat een sleutel op &quot;niet ingesteld&quot; terwijl je hem net in Vercel
            hebt gezet? Vink dan alle drie de omgevingen aan (Production, Preview,
            Development) en doe een redeploy — variabelen worden bij het bouwen
            ingebakken.
          </p>
        </>
      )}
    </div>
  );
}
