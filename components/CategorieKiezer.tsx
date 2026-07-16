"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Eén uitklapknop voor de categorie-filter: klik → lijst naar onder met alle
 * categorieën → kies er één (of "Alle bestanden") → klapt weer in. Filtert de
 * bestandenlijst via de URL (?categorie=…).
 */
export function CategorieKiezer({
  categorieen,
  actief,
}: {
  categorieen: string[];
  actief?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function buiten(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", buiten);
    return () => document.removeEventListener("mousedown", buiten);
  }, []);

  const huidig = actief || "Alle bestanden";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5 sm:w-72"
      >
        <span className="truncate">Categorie: {huidig}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-navy/15 bg-white py-1 shadow-lg sm:w-72">
          <Link
            href="/bestanden"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2 text-sm text-navy hover:bg-navy/5"
          >
            Alle bestanden
            {!actief && <Check size={15} className="text-oranje" />}
          </Link>
          {categorieen.map((c) => (
            <Link
              key={c}
              href={`/bestanden?categorie=${encodeURIComponent(c)}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm text-navy hover:bg-navy/5"
            >
              <span className="truncate">{c}</span>
              {actief === c && <Check size={15} className="shrink-0 text-oranje" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
