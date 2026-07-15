"use client";

import { useRef, useState } from "react";

/**
 * Klantlogo uploaden vanaf je apparaat (telefoon/laptop, elk beeldformaat).
 * Het gekozen bestand wordt client-side verkleind naar max 320px en als
 * data-URL in een verborgen veld (`logo_url`) meegestuurd met het formulier —
 * geen aparte bestandsopslag nodig. Je kunt ook nog steeds een URL plakken.
 */
export function KlantLogoUpload({
  initieel,
  name = "logo_url",
}: {
  initieel?: string | null;
  name?: string;
}) {
  const [waarde, setWaarde] = useState(initieel ?? "");
  const [bezig, setBezig] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function kies(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBezig(true);
    try {
      const dataUrl = await verkleinNaarDataUrl(file, 320);
      setWaarde(dataUrl);
    } catch {
      // Val terug op het ruwe bestand als verkleinen niet lukt.
      const reader = new FileReader();
      reader.onload = () => setWaarde(String(reader.result));
      reader.readAsDataURL(file);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">Logo klant (voor offertes)</label>

      <div className="flex items-center gap-3">
        {waarde ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={waarde}
            alt="Klantlogo"
            className="h-12 w-12 rounded border border-navy/10 object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-navy/20 text-xs text-navy/30">
            logo
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          {bezig ? "Bezig…" : "Upload logo klant"}
        </button>
        {waarde && (
          <button
            type="button"
            onClick={() => setWaarde("")}
            className="text-sm text-navy/40 hover:text-red-500"
          >
            Verwijderen
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={kies}
          className="hidden"
        />
      </div>

      {/* Alternatief: een URL plakken. */}
      <input
        type="text"
        value={waarde.startsWith("data:") ? "" : waarde}
        onChange={(e) => setWaarde(e.target.value)}
        placeholder="…of plak een logo-URL"
        className="mt-2 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />

      {/* Wat er echt wordt opgeslagen (data-URL of URL). */}
      <input type="hidden" name={name} value={waarde} />
    </div>
  );
}

/** Laadt een afbeelding, verkleint naar max `max` px en geeft een PNG-data-URL. */
function verkleinNaarDataUrl(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("lezen mislukt"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("laden mislukt"));
      img.onload = () => {
        const schaal = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * schaal));
        const h = Math.max(1, Math.round(img.height * schaal));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("geen canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
