"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { SwipeRij } from "@/components/ui/SwipeRij";
import type { SjabloonType } from "@/lib/sjablonen";

/**
 * Eén sjabloon-rij: tik om te bewerken, veeg naar links (iPhone-stijl) om te
 * verwijderen — met een bevestiging. Ook een prullenbak-knop als alternatief.
 */
export function SjabloonRij({
  id,
  naam,
  onderwerp,
  type,
  href,
  verwijderActie,
}: {
  id: string;
  naam: string;
  onderwerp: string | null;
  type: SjabloonType;
  href: string;
  verwijderActie: (id: string, type: SjabloonType) => Promise<void>;
}) {
  function verwijder() {
    if (!window.confirm("Weet je zeker dat je dit sjabloon wilt verwijderen?")) {
      throw new Error("geannuleerd"); // laat SwipeRij terugveren
    }
    return verwijderActie(id, type);
  }

  return (
    <SwipeRij onVerwijder={verwijder}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href={href} className="min-w-0 flex-1 truncate text-sm font-medium text-navy hover:underline">
          {naam}
          {onderwerp && <span className="ml-2 truncate font-normal text-navy/40">{onderwerp}</span>}
        </Link>
        <button
          type="button"
          onClick={() => Promise.resolve(verwijder()).catch(() => {})}
          aria-label="Verwijderen"
          className="shrink-0 text-navy/40 hover:text-red-500"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </SwipeRij>
  );
}
