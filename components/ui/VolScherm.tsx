"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * iPhone-stijl "vol scherm". Toont één knop; bij klikken opent een schermvullend
 * paneel met de inhoud en een X om terug te klappen (ook via Escape). Handig om
 * lange formulieren of brede secties compact te houden tot je ze nodig hebt.
 *
 * Kinderen mogen server-actions bevatten (formulieren): na een succesvolle actie
 * navigeert de pagina en klapt het paneel vanzelf weer in.
 */
export function VolScherm({
  label,
  titel,
  children,
  toon = "oranje",
  icoon,
  breed = "3xl",
  knopKlasse,
  standaardOpen = false,
  vullend = false,
}: {
  label: string;
  titel?: string;
  children: ReactNode;
  toon?: "oranje" | "navy" | "blauw";
  icoon?: ReactNode;
  breed?: "3xl" | "6xl" | "vol";
  knopKlasse?: string;
  standaardOpen?: boolean;
  /** Laat de inhoud het scherm exact vullen (geen padding/scroll) — bv. een iframe. */
  vullend?: boolean;
}) {
  const [open, setOpen] = useState(standaardOpen);
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

  const kleur =
    toon === "navy"
      ? "border border-navy/20 text-navy hover:bg-navy/5"
      : toon === "blauw"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-oranje text-white hover:bg-oranje/90";

  const maxBreed = breed === "vol" ? "max-w-none" : breed === "6xl" ? "max-w-6xl" : "max-w-3xl";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          knopKlasse ??
          `inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${kleur}`
        }
      >
        {icoon}
        {label}
      </button>

      {open &&
        gemonteerd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
            <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
              <h2 className="truncate text-lg font-semibold text-navy">{titel ?? label}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
              >
                <X size={18} />
              </button>
            </div>
            {vullend ? (
              <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className={`mx-auto ${maxBreed}`}>{children}</div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
