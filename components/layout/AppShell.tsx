"use client";

import { useState, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";
import { Zijbalk } from "@/components/layout/Zijbalk";
import { ZoekBalk } from "@/components/layout/ZoekBalk";

/**
 * Responsieve app-shell. Desktop: vaste zijbalk (232px). Mobiel: zijbalk als
 * uitschuifbaar menu achter een hamburger-knop.
 */
export function AppShell({
  userEmail,
  children,
}: {
  userEmail?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop-zijbalk */}
      <aside className="hidden w-[232px] shrink-0 md:block">
        <div className="fixed h-screen w-[232px]">
          <Zijbalk />
        </div>
      </aside>

      {/* Mobiel menu (drawer) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[232px] shadow-xl">
            <Zijbalk onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menu openen"
            className="rounded-lg border border-navy/20 p-3 text-navy md:hidden"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <ZoekBalk />
          {userEmail && (
            <span className="hidden text-sm text-navy/60 sm:inline">{userEmail}</span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
            >
              Uitloggen
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
