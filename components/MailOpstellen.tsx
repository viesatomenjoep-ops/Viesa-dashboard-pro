"use client";

import { useState } from "react";
import { MAIL_TEMPLATES } from "@/lib/mailtemplates";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * Opstelvenster voor een e-mail met sjabloon-keuze. Bij het kiezen van een
 * sjabloon worden onderwerp en bericht ingevuld (nog aanpasbaar vóór verzenden).
 */
export function MailOpstellen({
  verstuurActie,
  geconfigureerd,
}: {
  verstuurActie: (formData: FormData) => void;
  geconfigureerd: boolean;
}) {
  const [onderwerp, setOnderwerp] = useState("");
  const [tekst, setTekst] = useState("");

  function kiesTemplate(key: string) {
    const t = MAIL_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setOnderwerp(t.onderwerp);
    setTekst(t.tekst);
  }

  return (
    <form action={verstuurActie}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-navy">Sjabloon:</label>
        <select
          defaultValue="leeg"
          onChange={(e) => kiesTemplate(e.target.value)}
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          {MAIL_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.naam}
            </option>
          ))}
        </select>
        <span className="text-xs text-navy/40">
          Vult onderwerp + bericht in — je kunt daarna nog aanpassen.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="naar" type="email" required placeholder="Aan (ontvanger) *" className={inputCls} />
        <input name="antwoord_naar" type="email" placeholder="Antwoord naar (optioneel)" className={inputCls} />
      </div>
      <input
        name="onderwerp"
        required
        placeholder="Onderwerp *"
        value={onderwerp}
        onChange={(e) => setOnderwerp(e.target.value)}
        className={`${inputCls} mt-3`}
      />
      <textarea
        name="tekst"
        required
        rows={10}
        placeholder="Bericht *"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        className={`${inputCls} mt-3`}
      />
      <div className="mt-4">
        <button
          type="submit"
          disabled={!geconfigureerd}
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-50"
        >
          Versturen
        </button>
      </div>
    </form>
  );
}
