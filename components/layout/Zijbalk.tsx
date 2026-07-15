"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSecties } from "@/lib/navigatie";
import { Logo } from "@/components/ui/Logo";

/**
 * Navigatie-inhoud van de zijbalk (donkerblauw). Actief item = teal accent.
 * `onNavigate` wordt aangeroepen bij een klik (om het mobiele menu te sluiten).
 */
export function Zijbalk({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActief = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo size={52} />
        <div className="leading-tight">
          <div className="whitespace-nowrap font-merk text-base font-semibold tracking-tight text-white">
            Viesa Automations
          </div>
          <div className="text-xs font-medium text-white/80">Dashboard</div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navSecties.map((sectie) => (
          <div key={sectie.titel}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              {sectie.titel}
            </p>
            <div className="space-y-1">
              {sectie.items.map((item) => {
                const actief = isActief(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                      actief
                        ? "bg-white/10 font-semibold text-oranje"
                        : "font-medium text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
