"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { ADMIN_TYPES } from "@/lib/administratie";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * Maak of kies een foto van een bonnetje/factuur/bestelling. Op mobiel opent
 * `capture="environment"` direct de (achter)camera. Bijhorend: type, omschrijving
 * en bedrag. Wordt server-side opgeslagen (en best-effort naar Google Drive).
 */
export function ScanUpload({ actie }: { actie: (formData: FormData) => void }) {
  const [bestand, setBestand] = useState<string>("");

  return (
    <form action={actie} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5">
          <Camera size={16} />
          {bestand ? "Andere foto" : "Foto maken / kiezen"}
          <input
            type="file"
            name="foto"
            accept="image/*"
            capture="environment"
            required
            onChange={(e) => setBestand(e.target.files?.[0]?.name ?? "")}
            className="hidden"
          />
        </label>
        <select name="type" defaultValue="bonnetje" className={inputCls}>
          {ADMIN_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <input name="omschrijving" placeholder="Omschrijving" className={inputCls} />
        <input
          name="bedrag"
          inputMode="decimal"
          placeholder="Bedrag (€) — bv. 12,99"
          title="Op de cent nauwkeurig; komma of punt mag"
          className={inputCls}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          Opslaan
        </button>
        {bestand && <span className="text-xs text-navy/50">Gekozen: {bestand}</span>}
      </div>
    </form>
  );
}
