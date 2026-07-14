"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Roept /api/genereer-offerte aan (Claude) en ververst de pagina. */
export function GenereerKnop({ offerteId }: { offerteId: string }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function genereer() {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch("/api/genereer-offerte", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offerteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.fout ?? "Generatie mislukt.");
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Generatie mislukt.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={genereer}
        disabled={bezig}
        className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
      >
        {bezig ? "Genereren…" : "✨ Genereer met Claude"}
      </button>
      {fout && <span className="text-xs text-red-600">{fout}</span>}
    </div>
  );
}
