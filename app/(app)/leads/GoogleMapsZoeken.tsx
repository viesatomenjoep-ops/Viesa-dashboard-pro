"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zoekLeadsGoogleMaps } from "./acties";

/** Zoekt bedrijven via Google Maps (Apify) en slaat ze als lead op. */
export function GoogleMapsZoeken() {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  async function verzend(formData: FormData) {
    setBezig(true);
    setMelding(null);
    const res = await zoekLeadsGoogleMaps(formData);
    setBezig(false);
    if (res.fout) {
      setMelding(`Fout: ${res.fout}`);
      return;
    }
    const delen = [`${res.aantal} nieuwe lead(s) toegevoegd`];
    if (res.overgeslagen > 0) delen.push(`${res.overgeslagen} al bekend (overgeslagen)`);
    setMelding(delen.join(", ") + ".");
    router.refresh();
  }

  return (
    <form action={verzend} className="space-y-4">
      <p className="text-xs text-navy/60">
        Zoekt bedrijven op Google Maps (via Apify) en zet nieuwe resultaten om in leads met
        bron &ldquo;Prospector&rdquo;. Bedrijven met een al bekende Google-plaats worden overgeslagen.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Zoekterm *</label>
        <input
          name="zoekterm"
          required
          placeholder="bv. webshop, IT-bedrijf, restaurant"
          className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Locatie *</label>
        <input
          name="locatie"
          required
          placeholder="bv. Utrecht, Nederland"
          className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Aantal resultaten</label>
        <input
          name="max_resultaten"
          type="number"
          min={1}
          max={100}
          defaultValue={20}
          className="w-32 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-navy/70">
        <input type="checkbox" name="met_contactverrijking" className="mt-0.5" />
        <span>
          Verrijk met e-mail/LinkedIn van de website (betaalde Apify-add-on — extra kosten per
          bedrijf).
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={bezig}
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-50"
        >
          {bezig ? "Zoeken…" : "Zoek leads"}
        </button>
        {melding && <span className="text-xs text-navy/70">{melding}</span>}
      </div>
    </form>
  );
}
