"use client";

/**
 * "Download als PDF" — en dat is de hele PDF-oplossing.
 *
 * `window.print()` op deze pagina levert, dankzij de afdrukstijl in
 * rapport.css, een PDF die letterlijk hetzelfde document is als wat de klant op
 * het scherm ziet: hetzelfde lettertype, dezelfde meetbalken, dezelfde kleuren.
 * Geen tweede sjabloon om bij te houden, geen extra dienst, geen kosten.
 */
export function AfdrukKnop({ label = "Download als PDF" }: { label?: string }) {
  return (
    <button type="button" className="rap-knop rap-knop-stil" onClick={() => window.print()}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 22h8v-6H8v6z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
