import { type ReactNode } from "react";

/** Nette lege-staat met titel, uitleg en optionele actie. */
export function LegeStaat({
  titel,
  omschrijving,
  actie,
}: {
  titel: string;
  omschrijving?: string;
  actie?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-navy/20 bg-white p-10 text-center">
      <p className="text-sm font-medium text-navy">{titel}</p>
      {omschrijving && (
        <p className="mx-auto mt-1 max-w-md text-sm text-navy/60">
          {omschrijving}
        </p>
      )}
      {actie && <div className="mt-4 flex justify-center">{actie}</div>}
    </div>
  );
}
