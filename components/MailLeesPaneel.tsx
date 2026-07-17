"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Leesvenster voor een e-mail — op álle apparaten een volledig overlay-scherm
 * met een kruisje om terug te klappen (iPhone-stijl). Sluiten navigeert terug
 * naar de berichtenlijst (`sluitHref`).
 */
export function MailLeesPaneel({
  sluitHref,
  children,
}: {
  sluitHref: string;
  children: ReactNode;
}) {
  // Achtergrond-scroll blokkeren zolang het overlay open is.
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
      <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold text-navy">Bericht</span>
        <Link
          href={sluitHref}
          aria-label="Sluiten"
          className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
        >
          <X size={18} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
