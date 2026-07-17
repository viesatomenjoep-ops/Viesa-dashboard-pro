"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Groene "opgeslagen"-melding die midden in beeld verschijnt (niet ver bovenaan),
 * zodat je in één oogopslag ziet dat een handeling is gelukt. Verdwijnt vanzelf.
 * Rendert alleen als `toon` waar is.
 */
export function OpslagMelding({ toon, tekst = "Opgeslagen" }: { toon: boolean; tekst?: string }) {
  const [zichtbaar, setZichtbaar] = useState(toon);

  useEffect(() => {
    if (!toon) return;
    setZichtbaar(true);
    const t = setTimeout(() => setZichtbaar(false), 2600);
    return () => clearTimeout(t);
  }, [toon]);

  if (!zichtbaar) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-1/2 z-[70] flex -translate-y-1/2 justify-center px-4">
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-2xl">
        <CheckCircle2 size={22} className="shrink-0" />
        {tekst}
      </div>
    </div>
  );
}
