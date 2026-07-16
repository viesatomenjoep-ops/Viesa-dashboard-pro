"use client";

/**
 * Knoppen bovenaan een printpagina: terug (zodat je niet vastzit, ook in de
 * app-modus zonder browserbalk) en het printdialoog. Verborgen in print zelf.
 */
export function PrintKnop() {
  function terug() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/dashboard";
  }
  return (
    <div className="geen-print mb-4 flex flex-wrap justify-center gap-3 py-4">
      <button
        onClick={terug}
        className="rounded-lg border border-navy/20 bg-white px-5 py-2 text-sm font-medium text-navy hover:bg-navy/5"
      >
        ← Terug
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-oranje px-5 py-2 text-sm font-medium text-white hover:bg-oranje/90"
      >
        Opslaan als PDF / Printen
      </button>
    </div>
  );
}
