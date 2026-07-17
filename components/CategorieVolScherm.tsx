"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { BestandRij } from "@/components/BestandRij";
import type { DriveLink } from "@/lib/drivelinks";

/**
 * Categorie-chips voor /bestanden. Tik op een categorie → de bijbehorende
 * bestanden openen in een vol scherm dat je met een kruisje weer dichtklapt.
 */
export function CategorieVolScherm({
  categorieen,
  links,
  categorieenLijstId,
  bewerkActie,
  verwijderActie,
}: {
  categorieen: string[];
  links: DriveLink[];
  categorieenLijstId: string;
  bewerkActie: (formData: FormData) => void;
  verwijderActie: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [gemonteerd, setGemonteerd] = useState(false);

  useEffect(() => setGemonteerd(true), []);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", h);
    };
  }, [open]);

  const opties = ["Alle bestanden", ...categorieen];
  const zichtbaar =
    open && open !== "Alle bestanden"
      ? links.filter((l) => (l.categorie ?? "") === open)
      : links;

  return (
    <>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {opties.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setOpen(c)}
            className="shrink-0 rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            {c}
          </button>
        ))}
      </div>

      {open &&
        gemonteerd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
            <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
              <h2 className="truncate text-lg font-semibold text-navy">{open}</h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Sluiten"
                className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-4xl">
                {zichtbaar.length === 0 ? (
                  <LegeStaat titel="Geen bestanden" omschrijving="Er staan hier geen bestanden in deze categorie." />
                ) : (
                  <Kaart className="p-0">
                    <ul>
                      {zichtbaar.map((l, i) => (
                        <BestandRij
                          key={l.id}
                          link={l}
                          categorieenLijstId={categorieenLijstId}
                          bewerkActie={bewerkActie}
                          verwijderActie={verwijderActie}
                          bovenrand={i > 0}
                        />
                      ))}
                    </ul>
                  </Kaart>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
