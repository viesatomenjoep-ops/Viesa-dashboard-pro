"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { SwipeRij } from "@/components/ui/SwipeRij";
import type { SjabloonType } from "@/lib/sjablonen";

/**
 * Eén sjabloon-rij: tik om te bewerken, veeg naar links (iPhone-stijl) om te
 * verwijderen — met een bevestiging. Ook een prullenbak-knop als alternatief.
 *
 * De ster zet het sjabloon als favoriet; favorieten staan bovenaan, hier en in
 * de sjabloonkiezer van het mailvenster. De ster schakelt meteen om en draait
 * terug als de server het weigert — je hoeft niet op een herlaadbeurt te wachten.
 */
export function SjabloonRij({
  id,
  naam,
  onderwerp,
  type,
  href,
  favoriet = false,
  verwijderActie,
  favorietActie,
}: {
  id: string;
  naam: string;
  onderwerp: string | null;
  type: SjabloonType;
  href: string;
  favoriet?: boolean | null;
  verwijderActie: (id: string, type: SjabloonType) => Promise<void>;
  favorietActie?: (
    id: string,
    favoriet: boolean,
  ) => Promise<{ ok: boolean; fout?: string }>;
}) {
  const [ster, setSter] = useState(Boolean(favoriet));
  const [bezig, start] = useTransition();

  function verwijder() {
    if (!window.confirm("Weet je zeker dat je dit sjabloon wilt verwijderen?")) {
      throw new Error("geannuleerd"); // laat SwipeRij terugveren
    }
    return verwijderActie(id, type);
  }

  function wisselSter() {
    if (!favorietActie) return;
    const nieuw = !ster;
    setSter(nieuw); // meteen omschakelen
    start(async () => {
      const r = await favorietActie(id, nieuw);
      if (!r.ok) {
        setSter(!nieuw); // draai terug
        if (r.fout) window.alert(r.fout);
      }
    });
  }

  return (
    <SwipeRij onVerwijder={verwijder}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        {favorietActie && (
          <button
            type="button"
            onClick={wisselSter}
            disabled={bezig}
            aria-label={ster ? "Uit favorieten halen" : "Als favoriet markeren"}
            aria-pressed={ster}
            title={ster ? "Uit favorieten halen" : "Als favoriet markeren"}
            className={`shrink-0 ${
              ster ? "text-amber-500" : "text-navy/25 hover:text-amber-500"
            } disabled:opacity-50`}
          >
            <Star size={16} fill={ster ? "currentColor" : "none"} />
          </button>
        )}
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
