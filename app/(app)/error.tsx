"use client";

/**
 * Het vangnet onder het dashboard.
 *
 * Eén kapotte pagina hoorde het hele scherm niet leeg te maken. Dat gebeurde
 * wel: een bewaarde scan met een ontbrekend veld liet /scan omvallen, en de
 * gebruiker hield alleen "Application error: a client-side exception has
 * occurred" over — zonder navigatie, zonder weg terug, op elk apparaat.
 *
 * Deze grens vangt dat op: de melding blijft in het Nederlands, en er staat
 * altijd een knop om het opnieuw te proberen of terug te gaan.
 */

export default function DashboardFout({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-navy">Er ging hier iets mis</h1>
      <p className="mt-2 text-sm leading-relaxed text-navy/60">
        Deze pagina kon niet worden opgebouwd. De rest van het dashboard werkt
        gewoon — probeer het opnieuw, of ga terug naar het overzicht.
      </p>

      {error?.message && (
        <p className="mt-4 break-words rounded-lg bg-navy/[0.04] px-3 py-2 text-left font-mono text-xs text-navy/50">
          {error.message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
        >
          Opnieuw proberen
        </button>
        <a
          href="/"
          className="rounded-lg border border-navy/20 px-5 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Naar het dashboard
        </a>
      </div>
    </div>
  );
}
