"use client";

/** Knop die het printdialoog opent (→ "Opslaan als PDF"). Verborgen in print. */
export function PrintKnop() {
  return (
    <div className="geen-print mb-4 flex justify-center gap-3 py-4">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-oranje px-5 py-2 text-sm font-medium text-white hover:bg-oranje/90"
      >
        Opslaan als PDF / Printen
      </button>
    </div>
  );
}
