"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Locatieveld met echte adres-suggesties (via /api/geocode → OpenStreetMap).
 * Typ een postcode, adres of bedrijfsnaam en kies een echte locatie. Werkt ook
 * gewoon als vrij tekstveld (bv. voor "videogesprek").
 */
export function LocatieVeld({ name, placeholder }: { name: string; placeholder?: string }) {
  const [waarde, setWaarde] = useState("");
  const [opties, setOpties] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const gekozen = useRef(false);

  useEffect(() => {
    if (gekozen.current) {
      gekozen.current = false;
      return;
    }
    const q = waarde.trim();
    if (q.length < 3) {
      setOpties([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { resultaten?: string[] };
        setOpties(data.resultaten ?? []);
        setOpen(true);
      } catch {
        /* zoekopdracht afgebroken — negeren */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [waarde]);

  return (
    <div className="relative">
      <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
      <input
        name={name}
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        onFocus={() => opties.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        placeholder={placeholder ?? "Locatie of videogesprek"}
        className="w-full rounded-lg border border-navy/20 py-2 pl-9 pr-3 text-base text-navy outline-none focus:border-navy"
      />
      {open && opties.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-navy/15 bg-white py-1 shadow-lg">
          {opties.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  gekozen.current = true;
                  setWaarde(o);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-navy hover:bg-navy/5"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-navy/40" />
                <span className="line-clamp-2">{o}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
