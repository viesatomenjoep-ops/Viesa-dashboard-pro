"use client";

import { useState } from "react";
import { Check, Copy, FileText, Loader2, Megaphone, NotebookText, Wand2 } from "lucide-react";
import type { ContentSoort } from "@/lib/ai/project";
import { vatProjectSamenAgent, genereerProjectContent } from "../acties";

/**
 * Project-AI-paneel op de projectdetail: #8 (samenvatting + status-signaal +
 * klant-update) en #10 (case-study / social / portfolio-tekst). Read-only —
 * je kopieert de tekst zelf.
 */

type Blok = { titel: string; tekst: string };

const CONTENT: { soort: ContentSoort; label: string; icoon: typeof FileText }[] = [
  { soort: "case_study", label: "Case-study", icoon: FileText },
  { soort: "social", label: "Social post", icoon: Megaphone },
  { soort: "portfolio", label: "Portfolio-tekst", icoon: Wand2 },
];

export function ProjectAI({ projectId }: { projectId: string }) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [blokken, setBlokken] = useState<Blok[]>([]);
  const [gekopieerd, setGekopieerd] = useState<number | null>(null);

  async function samenvatten() {
    setBezig("samenvatting");
    setFout(null);
    try {
      const res = await vatProjectSamenAgent(projectId);
      if (!res.ok || !res.analyse) setFout(res.fout ?? "Er ging iets mis.");
      else
        setBlokken([
          { titel: "Samenvatting", tekst: res.analyse.samenvatting },
          { titel: "Status-signaal", tekst: res.analyse.signaal },
          { titel: "Concept klant-update", tekst: res.analyse.klant_update },
        ]);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setBezig(null);
    }
  }

  async function content(soort: ContentSoort, label: string) {
    setBezig(soort);
    setFout(null);
    try {
      const res = await genereerProjectContent(projectId, soort);
      if (!res.ok || !res.tekst) setFout(res.fout ?? "Er ging iets mis.");
      else setBlokken([{ titel: label, tekst: res.tekst }]);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setBezig(null);
    }
  }

  async function kopieer(i: number, tekst: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(i);
      setTimeout(() => setGekopieerd(null), 1800);
    } catch {
      /* geen clipboard */
    }
  }

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
          <NotebookText size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-navy">Project-AI</h2>
          <p className="text-xs text-navy/50">Samenvatten, signaleren en content maken uit de notities.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={samenvatten}
          disabled={bezig !== null}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {bezig === "samenvatting" ? <Loader2 size={15} className="animate-spin" /> : <NotebookText size={15} />}
          Samenvatting &amp; signaal
        </button>
        {CONTENT.map(({ soort, label, icoon: Icoon }) => (
          <button
            key={soort}
            onClick={() => content(soort, label)}
            disabled={bezig !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-60"
          >
            {bezig === soort ? <Loader2 size={15} className="animate-spin" /> : <Icoon size={15} />}
            {label}
          </button>
        ))}
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {blokken.length > 0 && (
        <div className="mt-4 space-y-3">
          {blokken.map((b, i) => (
            <div key={i} className="rounded-lg border border-navy/10 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-navy/40">{b.titel}</span>
                <button
                  onClick={() => kopieer(i, b.tekst)}
                  className="inline-flex items-center gap-1 text-xs text-navy/50 hover:text-navy"
                >
                  {gekopieerd === i ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {gekopieerd === i ? "Gekopieerd" : "Kopieer"}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy/90">{b.tekst}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
