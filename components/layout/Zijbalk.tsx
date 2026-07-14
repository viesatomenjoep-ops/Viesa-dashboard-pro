"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigatie";

/** Vaste zijbalk met navigatie; markeert de actieve pagina. */
export function Zijbalk() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-navy/10 bg-white">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold text-navy">Viesa</span>
        <span className="ml-1 text-lg font-light text-navy/50">
          Command Center
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const actief =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                actief
                  ? "bg-navy/5 font-medium text-navy"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
