"use client";

import { useState } from "react";
import { GroteEditor } from "@/components/GroteEditor";
import { vulVariabelen, type VariabeleContext } from "@/lib/variabelen";

type DocSjabloon = { id: string; naam: string; inhoud_html: string };

/**
 * Bewerker voor offertes/audits: een sjabloonkiezer boven de grote WYSIWYG-editor.
 * Kies je een sjabloon, dan wordt de inhoud ingevoegd met de {{variabelen}}
 * al ingevuld vanuit de gekoppelde klant.
 */
export function DocumentBewerker({
  naamHtml = "inhoud_html",
  beginHtml = "",
  sjablonen = [],
  ctx = {},
}: {
  naamHtml?: string;
  beginHtml?: string;
  sjablonen?: DocSjabloon[];
  ctx?: VariabeleContext;
}) {
  const [html, setHtml] = useState(beginHtml);
  const [sleutel, setSleutel] = useState(0);

  function kies(id: string) {
    const s = sjablonen.find((x) => x.id === id);
    if (!s) return;
    if (html.trim() && !window.confirm("Huidige inhoud vervangen door dit sjabloon?")) return;
    setHtml(vulVariabelen(s.inhoud_html, ctx));
    setSleutel((n) => n + 1);
  }

  return (
    <div>
      {sjablonen.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className="text-sm text-navy/60">Sjabloon invoegen:</label>
          <select
            defaultValue=""
            onChange={(e) => {
              kies(e.target.value);
              e.currentTarget.selectedIndex = 0;
            }}
            className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          >
            <option value="">Kies een sjabloon…</option>
            {sjablonen.map((s) => (
              <option key={s.id} value={s.id}>
                {s.naam}
              </option>
            ))}
          </select>
        </div>
      )}
      <GroteEditor key={sleutel} naamHtml={naamHtml} beginHtml={html} minHoogte={380} />
    </div>
  );
}
