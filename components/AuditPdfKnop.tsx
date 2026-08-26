"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { AuditAntwoord, GebundeldeConcurrent } from "./VisibilityAuditView";

/**
 * Downloadknop voor het PDF-rapport.
 *
 * `@react-pdf/renderer` is een zware bibliotheek die alleen in de browser
 * draait. Hem statisch importeren zou hem in de hoofdbundel trekken en elke
 * pagina van het dashboard vertragen — ook voor wie nooit een audit doet.
 * Daarom pas laden op het moment dat er echt op Download geklikt wordt.
 */
export function AuditPdfKnop({
  audit,
  concurrenten,
  bedrijfsnaam,
}: {
  audit: AuditAntwoord;
  concurrenten: GebundeldeConcurrent[];
  bedrijfsnaam?: string;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function download() {
    setBezig(true);
    setFout(null);
    try {
      // Beide pas hier inladen.
      const [{ pdf }, { AuditPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./AuditPDFDocument"),
      ]);

      const blob = await pdf(
        <AuditPDFDocument
          audit={audit}
          concurrenten={concurrenten}
          bedrijfsnaam={bedrijfsnaam}
        />,
      ).toBlob();

      const host = audit.target_url
        .replace(/^https?:\/\//, "")
        .replace(/[^a-z0-9.-]/gi, "-")
        .replace(/^-+|-+$/g, "");
      const datum = new Date().toISOString().slice(0, 10);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-visibility-audit-${host}-${datum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Even wachten voordat we de URL vrijgeven, anders breekt de download in
      // Safari af voordat hij begonnen is.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Het rapport kon niet gemaakt worden.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={download}
        disabled={bezig}
        className="inline-flex items-center gap-2 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
      >
        {bezig ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Rapport maken…
          </>
        ) : (
          <>
            <Download size={15} /> Download PDF
          </>
        )}
      </button>
      {fout && <p className="mt-1 text-xs text-red-600">{fout}</p>}
    </div>
  );
}
