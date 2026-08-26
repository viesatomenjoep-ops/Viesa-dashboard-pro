"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";

/**
 * Inline bewerkbare lead-score (0–100) met autosave. Pas de score aan met − / +;
 * na een korte pauze wordt hij automatisch opgeslagen en verschijnt kort een
 * groene "opgeslagen"-vink. Direct zichtbaar dat het gelukt is.
 */
export function ScoreVeld({
  id,
  score,
  opslaanActie,
}: {
  id: string;
  score: number;
  opslaanActie: (id: string, score: number) => Promise<{ ok: boolean; fout?: string }>;
}) {
  const [waarde, setWaarde] = useState(score);
  const [status, setStatus] = useState<"rust" | "bezig" | "gelukt">("rust");
  const eersteRender = useRef(true);

  // Server actions doorgegeven vanuit een server component krijgen bij elke
  // re-render (bv. een router.refresh() ergens anders op de pagina) een
  // nieuwe functiereferentie, ook al verandert er functioneel niets. Die
  // referentie in de dependency-array zetten liet deze effect daardoor
  // steeds opnieuw starten — de debounce-timer werd telkens gereset en
  // "Opslaan…" kwam nooit meer tot rust. Een ref omzeilt dat: alleen een
  // écht gewijzigde score (waarde) mag een nieuwe opslag triggeren.
  const opslaanActieRef = useRef(opslaanActie);
  useEffect(() => {
    opslaanActieRef.current = opslaanActie;
  }, [opslaanActie]);

  useEffect(() => {
    // Niet opslaan bij de allereerste render (alleen bij echte wijzigingen).
    if (eersteRender.current) {
      eersteRender.current = false;
      return;
    }
    setStatus("bezig");
    const t = setTimeout(async () => {
      const res = await opslaanActieRef.current(id, waarde);
      setStatus(res.ok ? "gelukt" : "rust");
      if (res.ok) setTimeout(() => setStatus("rust"), 1800);
    }, 600);
    return () => clearTimeout(t);
  }, [waarde, id]);

  const kleur =
    waarde >= 70 ? "text-emerald-600" : waarde >= 40 ? "text-amber-600" : "text-navy/60";

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-2 py-1.5">
      <span className="pl-1 text-xs font-medium text-navy/50">Score</span>
      <button
        type="button"
        onClick={() => setWaarde((v) => Math.max(0, v - 5))}
        aria-label="Score omlaag"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-navy/15 text-navy hover:bg-navy/5"
      >
        <Minus size={14} />
      </button>
      <span className={`w-8 text-center text-lg font-bold tabular-nums ${kleur}`}>{waarde}</span>
      <button
        type="button"
        onClick={() => setWaarde((v) => Math.min(100, v + 5))}
        aria-label="Score omhoog"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-navy/15 text-navy hover:bg-navy/5"
      >
        <Plus size={14} />
      </button>
      <span className="w-16 text-xs font-medium">
        {status === "bezig" && <span className="text-navy/40">Opslaan…</span>}
        {status === "gelukt" && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Check size={13} /> Opgeslagen
          </span>
        )}
      </span>
    </div>
  );
}
