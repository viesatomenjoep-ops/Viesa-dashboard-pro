"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, KeyboardEvent, MouseEvent } from "react";

/**
 * Maakt een volledige tabelrij klikbaar: klik (of Enter/Spatie) opent `href`.
 * Klikken op een geneste link/knop/formulier binnen de rij blijft gewoon werken.
 */
export function RijLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function open(e: MouseEvent | KeyboardEvent) {
    // Laat geneste interactieve elementen (links, knoppen, inputs) hun eigen gang gaan.
    const el = e.target as HTMLElement;
    if (el.closest("a,button,input,select,textarea,label")) return;
    router.push(href);
  }

  return (
    <tr
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e);
        }
      }}
      role="link"
      tabIndex={0}
      className={`cursor-pointer outline-none focus-visible:bg-navy/[0.04] ${className}`}
    >
      {children}
    </tr>
  );
}
