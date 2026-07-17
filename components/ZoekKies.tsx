"use client";

import { useState } from "react";

export type Optie = { waarde: string; sub?: string };

/**
 * Invoerveld met live suggesties: terwijl je typt verschijnen de best passende
 * opties in een dropdown. Werkt op alle apparaten (geen datalist). Kies een optie
 * of typ vrij verder.
 */
export function ZoekKies({
  value,
  onChange,
  onKies,
  opties,
  placeholder,
  name,
  type = "text",
  required = false,
  className = "",
  max = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  onKies?: (o: Optie) => void;
  opties: Optie[];
  placeholder?: string;
  name?: string;
  type?: string;
  required?: boolean;
  className?: string;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const term = value.toLowerCase().trim();
  const gefilterd = (
    term
      ? opties.filter((o) => `${o.waarde} ${o.sub ?? ""}`.toLowerCase().includes(term))
      : opties
  ).slice(0, max);

  return (
    <div className="relative">
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
      />
      {open && gefilterd.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-navy/15 bg-white py-1 shadow-lg">
          {gefilterd.map((o) => (
            <li key={o.waarde + (o.sub ?? "")}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.waarde);
                  onKies?.(o);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-navy/5"
              >
                <span className="font-medium text-navy">{o.waarde}</span>
                {o.sub && <span className="ml-2 text-navy/45">{o.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
