import { type ReactNode } from "react";

/** Paginakop met titel, optionele omschrijving en actie-slot (bv. een knop). */
export function PaginaKop({
  titel,
  omschrijving,
  actie,
}: {
  titel: string;
  omschrijving?: string;
  actie?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{titel}</h1>
        {omschrijving && (
          <p className="mt-1 text-sm text-navy/60">{omschrijving}</p>
        )}
      </div>
      {actie && <div className="shrink-0">{actie}</div>}
    </div>
  );
}
