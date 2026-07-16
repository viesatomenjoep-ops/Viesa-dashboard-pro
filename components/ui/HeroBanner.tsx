import { type ReactNode } from "react";

/**
 * Gradient-welkomstbanner (navy → teal) voor bovenaan een dashboard, naar het
 * voorbeeld van de Haze-stijl. Spaarzaam gebruiken: één per pagina, bovenaan.
 */
export function HeroBanner({
  titel,
  subtekst,
  actie,
}: {
  titel: string;
  subtekst?: ReactNode;
  actie?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-oranje px-6 py-7 text-white shadow-sm sm:px-8">
      {/* Subtiele lichtvlek rechtsboven voor diepte. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {titel}
          </h1>
          {subtekst && <p className="mt-1 text-sm text-white/80">{subtekst}</p>}
        </div>
        {actie && <div className="shrink-0">{actie}</div>}
      </div>
    </div>
  );
}
