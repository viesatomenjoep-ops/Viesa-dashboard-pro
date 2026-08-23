"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import type { Bron } from "@/lib/ai/kennis";
import { vraagAiOverData } from "./acties";

/**
 * AI-antwoordpaneel op /zoeken (#9). Neemt de huidige zoekterm als vraag en laat
 * de kennisagent één antwoord met bronnen schrijven op basis van de data.
 */
export function AiAntwoord({ vraag }: { vraag: string }) {
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [antwoord, setAntwoord] = useState<string | null>(null);
  const [bronnen, setBronnen] = useState<Bron[]>([]);

  async function vraagStellen() {
    setLaden(true);
    setFout(null);
    try {
      const res = await vraagAiOverData(vraag);
      if (!res.ok) setFout(res.fout ?? "Er ging iets mis.");
      setAntwoord(res.antwoord ?? null);
      setBronnen(res.bronnen ?? []);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy">Vraag het de AI</h2>
            <p className="text-xs text-navy/50">
              Antwoord op &ldquo;{vraag}&rdquo; op basis van je leads, projecten, notities en offertes.
            </p>
          </div>
        </div>
        <button
          onClick={vraagStellen}
          disabled={laden}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {laden ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {laden ? "Zoeken…" : antwoord ? "Opnieuw" : "Vraag het de AI"}
        </button>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {antwoord && (
        <div className="mt-4 space-y-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy/90">{antwoord}</p>
          {bronnen.length > 0 && (
            <div className="border-t border-navy/5 pt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-navy/40">
                Bronnen
              </p>
              <ol className="space-y-1">
                {bronnen.map((b, i) => (
                  <li key={i} className="text-xs text-navy/70">
                    <span className="text-navy/40">[{i + 1}]</span>{" "}
                    <Link href={b.link} className="font-medium text-navy hover:underline">
                      {b.titel}
                    </Link>{" "}
                    <span className="text-navy/40">· {b.type}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
