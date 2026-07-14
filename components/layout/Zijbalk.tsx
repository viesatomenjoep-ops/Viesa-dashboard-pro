"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSecties } from "@/lib/navigatie";

/**
 * Vaste donkerblauwe zijbalk (232px) met secties. Het actieve item krijgt de
 * oranje accentkleur.
 */
export function Zijbalk() {
  const pathname = usePathname();

  const isActief = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      style={{ width: 232 }}
      className="flex shrink-0 flex-col bg-navy text-white"
    >
      <div className="px-5 py-6">
        <span className="text-lg font-semibold">Viesa</span>
        <span className="ml-1 text-lg font-light text-white/50">
          Command Center
        </span>
      </div>

      <nav className="flex-1 space-y-6 px-3 pb-6">
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
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      actief
                        ? "bg-white/10 font-medium text-oranje"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
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
    </aside>
  );
}
