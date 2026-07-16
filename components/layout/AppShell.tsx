"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";
import { Zijbalk } from "@/components/layout/Zijbalk";
import { ZoekBalk } from "@/components/layout/ZoekBalk";
import { Logo } from "@/components/ui/Logo";
import { AgendaMeldingen } from "@/components/AgendaMeldingen";
import { MeldingenDropdown } from "@/components/layout/MeldingenDropdown";
import { GebruikerMenu } from "@/components/layout/GebruikerMenu";
import { PrefetchRoutes } from "@/components/layout/PrefetchRoutes";
import type { Notificatie } from "@/lib/notificaties";

/**
 * Responsieve app-shell. Desktop: vaste zijbalk (232px). Mobiel: zijbalk als
 * uitschuifbaar menu achter een hamburger-knop.
 */
export function AppShell({
  userEmail,
  meldingen = [],
  ongelezen = 0,
  children,
}: {
  userEmail?: string;
  meldingen?: Notificatie[];
  ongelezen?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <PrefetchRoutes />
      {/* Desktop-zijbalk — grotere widget-tegels */}
      <aside className="hidden w-[256px] shrink-0 md:block">
        <div className="fixed h-screen w-[256px]">
          <Zijbalk variant="desktop" />
        </div>
      </aside>

      {/* Mobiel menu (volledige breedte, met sluitknop) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="relative h-full w-full shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Menu sluiten"
              className="absolute right-4 top-6 z-10 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              ✕ Terug
            </button>
            <Zijbalk variant="mobiel" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Menu openen"
              className="rounded-lg border border-navy/20 p-2.5 text-navy md:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Merk — logo + naam (klein), tussen hamburger en de rest. Alleen op
                mobiel; op desktop staat het merk al in de zijbalk. Klikt naar home. */}
            <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
              <Logo size={28} />
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-merk text-sm font-semibold text-navy">
                  Viesa Automations
                </span>
                <span className="block text-[10px] font-medium text-navy/50">Dashboard</span>
              </span>
            </Link>

            {/* Zoekbalk op één regel vanaf sm (tablet/desktop). */}
            <div className="hidden flex-1 sm:flex">
              <ZoekBalk />
            </div>

            {/* Rechts: push-belletje (alleen desktop), meldingen en gebruiker. */}
            <div className="flex shrink-0 items-center justify-end gap-2">
              <span className="hidden sm:inline-flex">
                <AgendaMeldingen />
              </span>
              <MeldingenDropdown meldingen={meldingen} ongelezen={ongelezen} />
              <GebruikerMenu email={userEmail} signOutActie={signOut} />
            </div>
          </div>

          {/* Op mobiel krijgt de zoekbalk een eigen, volledige regel. */}
          <div className="mt-2 sm:hidden">
            <ZoekBalk />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
