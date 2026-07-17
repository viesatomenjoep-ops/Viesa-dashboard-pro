"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
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
  info,
  children,
}: {
  userEmail?: string;
  meldingen?: Notificatie[];
  ongelezen?: number;
  info?: { openTaken: number; leads: number; openstaand: number; offertes: number; klanten: number };
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
            <Zijbalk variant="mobiel" info={info} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Menu openen"
              className="rounded-xl border border-navy/20 p-3 text-navy md:hidden"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Merk — logo + naam (compact), tussen hamburger en de rest. Alleen op
                mobiel; op desktop staat het merk al in de zijbalk. Klikt naar home. */}
            <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
              <Logo size={30} />
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

            {/* Rechts: op desktop de losse bel + meldingen; op mobiel zit dat in het
                gebruikersmenu zodat de merknaam bovenaan mooi past. */}
            <div className="flex shrink-0 items-center justify-end gap-2">
              <span className="hidden sm:inline-flex">
                <AgendaMeldingen />
              </span>
              <span className="hidden sm:inline-flex">
                <MeldingenDropdown meldingen={meldingen} ongelezen={ongelezen} />
              </span>
              <GebruikerMenu
                email={userEmail}
                signOutActie={signOut}
                extra={
                  <div className="space-y-2 sm:hidden">
                    <Link
                      href="/notificaties"
                      className="flex items-center justify-between rounded-lg border border-navy/15 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Bell size={16} /> Notificaties
                      </span>
                      {ongelezen > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-oranje px-1.5 text-xs font-semibold text-white">
                          {ongelezen > 9 ? "9+" : ongelezen}
                        </span>
                      )}
                    </Link>
                    <AgendaMeldingen />
                  </div>
                }
              />
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
