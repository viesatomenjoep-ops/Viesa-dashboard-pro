"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { bewaarDesignDoc, syncNaarGitHub } from "./acties";

/** Donkere, monospaced editor met live preview, autosave en GitHub-sync. */
export function DesignEditor({
  id,
  beginwaarde,
}: {
  id: string;
  beginwaarde: string;
}) {
  const [tekst, setTekst] = useState(beginwaarde);
  const [status, setStatus] = useState<"opgeslagen" | "bezig" | "wijzig">("opgeslagen");
  const [syncMelding, setSyncMelding] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave (debounced).
  useEffect(() => {
    if (tekst === beginwaarde && status === "opgeslagen") return;
    setStatus("wijzig");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("bezig");
      await bewaarDesignDoc(id, tekst);
      setStatus("opgeslagen");
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekst]);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst);
      setSyncMelding("Gekopieerd naar klembord.");
      setTimeout(() => setSyncMelding(null), 2000);
    } catch {
      setSyncMelding("Kopiëren mislukt.");
    }
  }

  async function sync() {
    setSyncMelding("Synchroniseren…");
    const res = await syncNaarGitHub(id);
    setSyncMelding(res.ok ? "Gesynct met GitHub." : `Fout: ${res.fout}`);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sync}
          className="rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
        >
          Sync met GitHub
        </button>
        <button
          type="button"
          onClick={kopieer}
          className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Kopieer voor Claude
        </button>
        <span className="text-xs text-navy/50">
          {status === "opgeslagen" ? "Opgeslagen" : status === "bezig" ? "Opslaan…" : "Niet-opgeslagen wijzigingen"}
        </span>
        {syncMelding && <span className="text-xs text-navy/60">{syncMelding}</span>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          spellCheck={false}
          style={{ height: 480 }}
          className="w-full rounded-lg border border-navy/20 bg-[#0f2733] p-4 font-mono text-sm text-[#d7e6ee] outline-none focus:border-oranje"
        />
        <div
          style={{ height: 480 }}
          className="overflow-y-auto rounded-lg border border-navy/10 bg-white p-4"
        >
          <Markdown tekst={tekst} />
        </div>
      </div>
    </div>
  );
}
