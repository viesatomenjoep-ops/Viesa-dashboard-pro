"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/Markdown";

/**
 * Markdown-editor met live preview. De <textarea> heeft `name={naam}` zodat de
 * waarde gewoon met een form-submit (server action) meegaat.
 */
export function MarkdownEditor({
  naam,
  beginwaarde = "",
  hoogte = 320,
}: {
  naam: string;
  beginwaarde?: string;
  hoogte?: number;
}) {
  const [tekst, setTekst] = useState(beginwaarde);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-navy/40">
          Markdown
        </p>
        <textarea
          name={naam}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          style={{ height: hoogte }}
          className="w-full rounded-lg border border-navy/20 p-3 font-mono text-sm text-navy outline-none focus:border-navy"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-navy/40">
          Voorbeeld
        </p>
        <div
          style={{ height: hoogte }}
          className="overflow-y-auto rounded-lg border border-navy/10 bg-white p-4"
        >
          <Markdown tekst={tekst} />
        </div>
      </div>
    </div>
  );
}
