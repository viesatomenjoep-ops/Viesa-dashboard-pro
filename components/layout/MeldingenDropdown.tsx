"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NOTIFICATIE_STIJL, type Notificatie } from "@/lib/notificaties";

function tijdKort(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

/** Bel met ongelezen-teller en een dropdown met de laatste meldingen. */
export function MeldingenDropdown({
  meldingen,
  ongelezen,
}: {
  meldingen: Notificatie[];
  ongelezen: number;
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
        aria-label="Notificaties"
        className="relative rounded-xl border border-navy/20 p-2.5 text-navy hover:bg-navy/5"
      >
        <Bell size={23} />
        {ongelezen > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-oranje px-1 text-[10px] font-semibold text-white">
            {ongelezen > 9 ? "9+" : ongelezen}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-lg sm:w-80">
          <div className="flex items-center justify-between border-b border-navy/10 px-4 py-2.5">
            <span className="text-sm font-semibold text-navy">Notificaties</span>
            {ongelezen > 0 && <span className="text-xs text-navy/50">{ongelezen} ongelezen</span>}
          </div>
          {meldingen.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-navy/40">Geen meldingen.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {meldingen.map((n) => {
                const { icoon: Icoon, vlak } = NOTIFICATIE_STIJL[n.type] ?? NOTIFICATIE_STIJL.info;
                return (
                  <li key={n.id} className="border-b border-navy/5 last:border-0">
                    <Link
                      href={n.link ?? "/notificaties"}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-navy/[0.02] ${
                        n.gelezen ? "" : "bg-navy/[0.015]"
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${vlak}`}
                      >
                        <Icoon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm text-navy ${n.gelezen ? "" : "font-semibold"}`}>
                          {n.titel}
                        </p>
                        {n.tekst && <p className="truncate text-xs text-navy/50">{n.tekst}</p>}
                        <p className="mt-0.5 text-[11px] text-navy/40">{tijdKort(n.created_at)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/notificaties"
            onClick={() => setOpen(false)}
            className="block border-t border-navy/10 px-4 py-2.5 text-center text-sm font-medium text-oranje hover:bg-navy/[0.02]"
          >
            Alle notificaties
          </Link>
        </div>
      )}
    </div>
  );
}
