"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-l-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/** Zorgt dat een ingetypt adres altijd met een protocol geopend wordt. */
function normaliseer(url: string): string {
  const s = url.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/**
 * Websiteveld met een "Open website"-knop ernaast. De knop opent het adres dat
 * op dát moment in het veld staat (dus ook een net gewijzigd, nog niet
 * opgeslagen adres) in een nieuw tabblad. Post gewoon `website` mee in het
 * formulier, net als een normaal invoerveld.
 */
export function WebsiteVeld({
  label = "Website",
  naam = "website",
  waarde,
  compact = false,
  placeholder = "www.voorbeeld.nl",
  className = "",
}: {
  label?: string;
  naam?: string;
  waarde: string | null;
  /** Compacte variant zonder label — voor snelformulieren met placeholders. */
  compact?: boolean;
  placeholder?: string;
  /** Extra klassen op de veld+knop-rij (bv. `min-w-40 flex-1` in een flexbalk). */
  className?: string;
}) {
  const [url, setUrl] = useState(waarde ?? "");
  const doel = normaliseer(url);

  const rij = (
    <div className={`flex ${className}`}>
      <input
        name={naam}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
        <a
          href={doel || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!doel}
          title={doel ? "Open website in nieuw tabblad" : "Vul eerst een adres in"}
          className={`flex shrink-0 items-center gap-1.5 rounded-r-lg border border-l-0 px-3 text-sm font-medium ${
            doel
              ? "border-oranje/40 text-oranje hover:bg-oranje/5"
              : "pointer-events-none border-navy/20 text-navy/30"
          }`}
          onClick={(e) => {
            if (!doel) e.preventDefault();
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span className="hidden sm:inline">Open</span>
        </a>
      </div>
    );

  if (compact) return rij;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">{label}</label>
      {rij}
    </div>
  );
}
