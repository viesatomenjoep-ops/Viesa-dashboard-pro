"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Gebruikersmenu rechtsboven: het Viesa-logo + het ingelogde e-mailadres, met
 * een dropdown voor uitloggen. Geen nep-persoon — dit is een gedeelde werkruimte.
 */
export function GebruikerMenu({
  email,
  signOutActie,
}: {
  email?: string;
  signOutActie: () => Promise<void>;
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-navy/20 py-1.5 pl-1.5 pr-2.5 hover:bg-navy/5"
      >
        <Logo size={36} />
        {email && <span className="hidden max-w-[160px] truncate text-sm text-navy/70 sm:inline">{email}</span>}
        <ChevronDown size={18} className="text-navy/50" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-lg">
          <div className="border-b border-navy/10 px-4 py-3">
            <p className="text-xs text-navy/50">Ingelogd als</p>
            <p className="truncate text-sm font-medium text-navy">{email ?? "—"}</p>
          </div>
          <form action={signOutActie}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-navy hover:bg-navy/5"
            >
              <LogOut size={16} /> Uitloggen
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
