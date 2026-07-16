"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Leesvenster voor een e-mail. Op desktop (lg+) toont het gewoon inline in de
 * derde kolom. Op mobiel opent het als volledig overlay-scherm met een kruisje
 * om terug te klappen — niet meer "naar beneden uitklappend". Sluiten navigeert
 * terug naar de berichtenlijst (`sluitHref`).
 */
export function MailLeesPaneel({
  sluitHref,
  children,
}: {
  sluitHref: string;
  children: ReactNode;
}) {
  // Op mobiel achtergrond-scroll blokkeren zolang het overlay open is.
  useEffect(() => {
    const mobiel = window.matchMedia("(max-width: 1023px)").matches;
    if (!mobiel) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond lg:static lg:z-auto lg:block lg:bg-transparent">
      {/* Kop met kruisje — alleen op mobiel; op desktop zit alles in de kaart. */}
      <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-navy">Bericht</span>
        <Link
          href={sluitHref}
          aria-label="Sluiten"
          className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
        >
          <X size={18} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4 lg:overflow-visible lg:p-0">{children}</div>
    </div>
  );
}
