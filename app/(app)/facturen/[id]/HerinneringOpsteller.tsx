"use client";

import { useState } from "react";
import { Check, Copy, Lightbulb, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { stelHerinneringOp } from "../acties";

/**
 * Debiteuren-agent-paneel op de factuurdetail. Eén knop laat de agent een
 * concept-betalingsherinnering schrijven met de juiste toon. De gebruiker kijkt
 * na, past aan, kopieert of opent 'm in de mail — de agent verstuurt nooit zelf.
 */
export function HerinneringOpsteller({ factuurId }: { factuurId: string }) {
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [onderwerp, setOnderwerp] = useState("");
  const [tekst, setTekst] = useState("");
  const [meta, setMeta] = useState<{ toon: string; dagenTeLaat: number } | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  async function genereer() {
    setLaden(true);
    setFout(null);
    try {
      const res = await stelHerinneringOp(factuurId);
      if (!res.ok || !res.concept) {
        setFout(res.fout ?? "Er ging iets mis.");
      } else {
        setOnderwerp(res.concept.onderwerp);
        setTekst(res.concept.tekst);
        setMeta({ toon: res.concept.toon, dagenTeLaat: res.concept.dagenTeLaat });
      }
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(`${onderwerp}\n\n${tekst}`);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 1800);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  const mailto = `mailto:?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
            <Lightbulb size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy">AI-betalingsherinnering</h2>
            <p className="text-xs text-navy/50">
              De agent kiest de juiste toon; jij kijkt na en verstuurt zelf.
            </p>
          </div>
        </div>
        <button
          onClick={genereer}
          disabled={laden}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {laden ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
          {laden ? "Bezig…" : tekst ? "Opnieuw" : "Herinnering opstellen"}
        </button>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {tekst && (
        <div className="mt-4 space-y-3">
          {meta && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge toon={meta.dagenTeLaat > 30 ? "rood" : meta.dagenTeLaat > 14 ? "amber" : "blauw"}>
                {meta.dagenTeLaat > 0 ? `${meta.dagenTeLaat} dagen te laat` : "nog niet verstreken"}
              </Badge>
              <span className="text-xs text-navy/50">Toon: {meta.toon}</span>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/50">Onderwerp</label>
            <input
              value={onderwerp}
              onChange={(e) => setOnderwerp(e.target.value)}
              className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/50">Bericht</label>
            <textarea
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm leading-relaxed text-navy outline-none focus:border-navy"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={kopieer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
            >
              {gekopieerd ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              {gekopieerd ? "Gekopieerd" : "Kopiëren"}
            </button>
            <a
              href={mailto}
              className="inline-flex items-center gap-1.5 rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
            >
              <Mail size={15} /> Openen in mail
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
