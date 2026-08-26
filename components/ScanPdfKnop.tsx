"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ScanRapport } from "@/lib/scan";

/**
 * Downloadknop voor een bewaard scanrapport. `@react-pdf/renderer` pas laden
 * bij een echte klik — zie AuditPdfKnop.tsx voor dezelfde reden (zware
 * bibliotheek die niet in elke pagina's hoofdbundel hoort).
 */
export function ScanPdfKnop({ rapport }: { rapport: ScanRapport }) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function download() {
    setBezig(true);
    setFout(null);
    try {
      const [{ pdf }, { ScanPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ScanPDFDocument"),
      ]);
      const blob = await pdf(<ScanPDFDocument rapport={rapport} />).toBlob();

      const datum = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `websitescan-${rapport.host}-${datum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Het rapport kon niet gemaakt worden.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={bezig}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-2.5 py-1 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
      >
        {bezig ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        PDF
      </button>
      {fout && <p className="mt-1 text-xs text-red-600">{fout}</p>}
    </div>
  );
}
