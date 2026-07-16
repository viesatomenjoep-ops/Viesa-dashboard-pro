"use client";

import { useId, useState } from "react";
import { GroteEditor } from "@/components/GroteEditor";
import { contextVanKlant, vulVariabelen, type VariabeleContext } from "@/lib/variabelen";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export type KlantOptie = {
  id: string;
  bedrijf: string;
  email: string | null;
  contact_naam?: string | null;
  voornaam?: string | null;
  achternaam?: string | null;
  website?: string | null;
  stad?: string | null;
  telefoon?: string | null;
};

type MailSjabloon = {
  id: string;
  naam: string;
  onderwerp: string | null;
  inhoud_html: string;
};

/**
 * Opstelvenster voor een e-mail. Kies een sjabloon uit de sjablonen-machine
 * (vult onderwerp + bericht) en/of een klant — dan vullen we het e-mailadres in
 * én de {{variabelen}} in het sjabloon met de gegevens van die klant.
 */
export function MailOpstellen({
  verstuurActie,
  geconfigureerd,
  klanten = [],
  sjablonen = [],
  initieelNaar = "",
  initieelOnderwerp = "",
}: {
  verstuurActie: (formData: FormData) => void;
  geconfigureerd: boolean;
  klanten?: KlantOptie[];
  sjablonen?: MailSjabloon[];
  initieelNaar?: string;
  initieelOnderwerp?: string;
}) {
  const [onderwerp, setOnderwerp] = useState(initieelOnderwerp);
  const [naar, setNaar] = useState(initieelNaar);
  const [toonCcBcc, setToonCcBcc] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const [editorSleutel, setEditorSleutel] = useState(0);
  const [ctx, setCtx] = useState<VariabeleContext>({});
  const [sjabloonId, setSjabloonId] = useState("");
  const listId = useId();

  function pasSjabloonToe(id: string, context: VariabeleContext) {
    const s = sjablonen.find((x) => x.id === id);
    if (!s) return;
    setOnderwerp(vulVariabelen(s.onderwerp ?? "", context, false));
    setEditorHtml(vulVariabelen(s.inhoud_html, context));
    setEditorSleutel((n) => n + 1);
  }

  function kiesSjabloon(id: string) {
    setSjabloonId(id);
    if (id) pasSjabloonToe(id, ctx);
  }

  function kiesKlant(bedrijf: string) {
    const k = klanten.find((x) => x.bedrijf === bedrijf);
    if (!k) return;
    if (k.email) setNaar(k.email);
    const nieuweCtx = contextVanKlant(k);
    setCtx(nieuweCtx);
    // Sjabloon opnieuw invullen met de gegevens van deze klant.
    if (sjabloonId) pasSjabloonToe(sjabloonId, nieuweCtx);
  }

  return (
    <form action={verstuurActie}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-navy">Sjabloon:</label>
        <select
          value={sjabloonId}
          onChange={(e) => kiesSjabloon(e.target.value)}
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="">Leeg bericht</option>
          {sjablonen.map((s) => (
            <option key={s.id} value={s.id}>
              {s.naam}
            </option>
          ))}
        </select>
        <span className="text-xs text-navy/40">
          {sjablonen.length === 0
            ? "Nog geen sjablonen — maak ze bij Sjablonen."
            : "Vult onderwerp + bericht; kies ook een klant om variabelen in te vullen."}
        </span>
      </div>

      {/* Klant kiezen → vult e-mailadres én variabelen */}
      {klanten.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-navy">Klant:</label>
          <input
            list={listId}
            placeholder="Klant zoeken → vult e-mail + variabelen…"
            onChange={(e) => kiesKlant(e.target.value)}
            autoComplete="off"
            className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <datalist id={listId}>
            {klanten.map((k) => (
              <option key={k.id} value={k.bedrijf} />
            ))}
          </datalist>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <input
            name="naar"
            type="email"
            required
            placeholder="Aan (ontvanger) *"
            value={naar}
            onChange={(e) => setNaar(e.target.value)}
            className={inputCls}
          />
          {!toonCcBcc && (
            <button
              type="button"
              onClick={() => setToonCcBcc(true)}
              className="shrink-0 rounded-lg border border-navy/20 px-3 py-2 text-xs font-medium text-navy/70 hover:bg-navy/5"
            >
              Cc/Bcc
            </button>
          )}
        </div>
        <input name="antwoord_naar" type="email" placeholder="Antwoord naar (optioneel)" className={inputCls} />
      </div>

      {toonCcBcc && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="cc" placeholder="Cc (komma's tussen adressen)" className={inputCls} />
          <input name="bcc" placeholder="Bcc (komma's tussen adressen)" className={inputCls} />
        </div>
      )}
      <input
        name="onderwerp"
        required
        placeholder="Onderwerp *"
        value={onderwerp}
        onChange={(e) => setOnderwerp(e.target.value)}
        className={`${inputCls} mt-3`}
      />
      <div className="mt-3">
        <GroteEditor key={editorSleutel} beginHtml={editorHtml} />
      </div>
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
