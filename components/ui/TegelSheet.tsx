"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * KPI-tegel die bij klikken een volledig scherm opent met de bijbehorende lijst
 * en met een kruisje (of Escape) weer dichtklapt. Werkt op mobiel én desktop.
 *
 * `tegel` is de zichtbare inhoud van de tegel (meestal een <StatKaart/> zonder
 * href); `children` is de lijst die in het volle scherm verschijnt.
 */
export function TegelSheet({
  tegel,
  titel,
  children,
}: {
  tegel: ReactNode;
  titel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [gemonteerd, setGemonteerd] = useState(false);

  useEffect(() => setGemonteerd(true), []);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", h);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block h-full w-full text-left [&>div]:transition-colors [&>div]:hover:border-navy/30"
      >
        {tegel}
      </button>

      {open &&
        gemonteerd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
            <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
              <h2 className="truncate text-lg font-semibold text-navy">{titel}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-4xl">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
