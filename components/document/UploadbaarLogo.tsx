"use client";

import { useState } from "react";

/**
 * Logo op het briefpapier dat je eenmalig kunt uploaden (SVG/PNG/JPEG). Wordt
 * client-side ingelezen (base64) en NIET opgeslagen — puur voor deze PDF.
 * De upload-knop is `geen-print` en verdwijnt dus bij het afdrukken/PDF-maken.
 */
export function UploadbaarLogo({ initieel }: { initieel?: string | null }) {
  const [src, setSrc] = useState(initieel ?? "");

  function kies(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-2">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Logo klant" className="h-8 max-w-[120px] object-contain" />
      )}
      <label className="geen-print cursor-pointer text-xs text-navy/40 underline hover:text-navy">
        {src ? "logo wijzigen" : "logo uploaden"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,.svg,.png,.jpg,.jpeg"
          onChange={kies}
          className="hidden"
        />
      </label>
    </div>
  );
}
