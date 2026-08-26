"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zoekLeadsGoogleMaps } from "./acties";

/** De bronnen, in volgorde van wat ze kosten: gratis eerst. */
const BRONNEN = [
  {
    key: "osm",
    naam: "OpenStreetMap",
    uitleg:
      "Gratis, geen sleutel nodig. Vindt juist bedrijven die géén Google-vermelding onderhouden.",
    kosten: "gratis",
  },
  {
    key: "zoeken",
    naam: "Google Zoeken",
    uitleg:
      "Vindt bedrijven zonder Maps-vermelding. Levert naam en website, geen adres of telefoon. 100 opdrachten per dag gratis.",
    kosten: "gratis tegoed",
  },
  {
    key: "places",
    naam: "Google Places",
    uitleg: "Bedrijven van de kaart, met adres en telefoon. Gratis maandelijks tegoed.",
    kosten: "gratis tegoed",
  },
  {
    key: "apify",
    naam: "Apify",
    uitleg: "Kant-en-klaar, optioneel e-mail/LinkedIn erbij.",
    kosten: "betaald per bedrijf",
  },
  {
    key: "claude",
    naam: "Claude",
    uitleg:
      "Zoekt zelf op het web en beoordeelt wat hij vindt. Voor opdrachten in gewone taal die zich niet in zoekwoorden laten vangen.",
    kosten: "kost tokens",
  },
] as const;

type BronKey = (typeof BRONNEN)[number]["key"];

/**
 * Zoekt bedrijven en slaat ze als lead op.
 *
 * Vijf bronnen met hetzelfde formulier, want ze leveren allemaal dezelfde rij
 * op. Ze vinden bewust niet hetzelfde: OpenStreetMap en Google Zoeken vinden
 * juist de bedrijven zónder Google-vermelding — vaak precies het type dat nog
 * handmatig werkt — terwijl Places en Apify de kaartgegevens hebben. Claude
 * kan een opdracht in gewone taal aan, maar kost als enige tokens.
 */
export function GoogleMapsZoeken() {
  const router = useRouter();
  const [bron, setBron] = useState<BronKey>("osm");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  async function verzend(formData: FormData) {
    // Dezelfde afspraak als bij de bellijst: wat geld kost, vraagt eerst.
    if (bron === "claude" && !window.confirm(
      "Claude zoekt hiervoor zelf meerdere keren op het web. Dat kost tokens.\n\n" +
        "Voor een gewone zoekterm zijn OpenStreetMap en Google Zoeken gratis én completer.\n\n" +
        "Weet u het zeker?",
    )) return;

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
        Zoekt bedrijven en zet nieuwe resultaten om in leads met bron &ldquo;Prospector&rdquo;.
        Bedrijven die al in de lijst staan worden overgeslagen. Elke bron vindt net iets anders —
        draai er gerust twee achter elkaar.
      </p>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Bron</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {BRONNEN.map((b) => (
            <label
              key={b.key}
              className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                bron === b.key ? "border-navy/40 bg-navy/[0.03]" : "border-navy/10"
              }`}
            >
              <input
                type="radio"
                name="bron"
                value={b.key}
                checked={bron === b.key}
                onChange={() => setBron(b.key)}
                className="mt-0.5"
              />
              <span className="text-navy/70">
                <span className="font-medium text-navy">{b.naam}</span>{" "}
                <span
                  className={
                    b.kosten === "gratis"
                      ? "text-emerald-700"
                      : b.kosten === "kost tokens" || b.kosten === "betaald per bedrijf"
                        ? "text-amber-700"
                        : "text-navy/45"
                  }
                >
                  · {b.kosten}
                </span>
                <span className="mt-0.5 block">{b.uitleg}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

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

      {bron === "apify" && (
        <label className="flex items-start gap-2 text-xs text-navy/70">
          <input type="checkbox" name="met_contactverrijking" className="mt-0.5" />
          <span>
            Verrijk met e-mail/LinkedIn van de website (betaalde Apify-add-on — extra kosten per
            bedrijf).
          </span>
        </label>
      )}

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
