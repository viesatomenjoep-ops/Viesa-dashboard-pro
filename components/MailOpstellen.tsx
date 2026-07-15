"use client";

import { useId, useState } from "react";
import { MAIL_TEMPLATES } from "@/lib/mailtemplates";
import { RijkeEditor } from "@/components/RijkeEditor";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

type KlantOptie = { id: string; bedrijf: string; email: string | null };

/** Zet platte sjabloontekst om naar veilige HTML (voor de rich-editor). */
function tekstNaarHtml(tekst: string): string {
  const veilig = tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return veilig.replace(/\n/g, "<br/>");
}

/**
 * Opstelvenster voor een e-mail. Kies een sjabloon (vult onderwerp + bericht),
 * of kies een klant — dan wordt automatisch het e-mailadres van die klant als
 * ontvanger ingevuld.
 */
export function MailOpstellen({
  verstuurActie,
  geconfigureerd,
  klanten = [],
  initieelNaar = "",
  initieelOnderwerp = "",
}: {
  verstuurActie: (formData: FormData) => void;
  geconfigureerd: boolean;
  klanten?: KlantOptie[];
  initieelNaar?: string;
  initieelOnderwerp?: string;
}) {
  const [onderwerp, setOnderwerp] = useState(initieelOnderwerp);
  const [naar, setNaar] = useState(initieelNaar);
  const [toonCcBcc, setToonCcBcc] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const [editorSleutel, setEditorSleutel] = useState(0);
  const listId = useId();

  function kiesTemplate(key: string) {
    const t = MAIL_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setOnderwerp(t.onderwerp);
    // Editor opnieuw opbouwen met de sjabloontekst als startinhoud.
    setEditorHtml(tekstNaarHtml(t.tekst));
    setEditorSleutel((n) => n + 1);
  }

  function kiesKlant(bedrijf: string) {
    const k = klanten.find((x) => x.bedrijf === bedrijf);
    if (k?.email) setNaar(k.email);
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

      {/* Klant kiezen → vult automatisch het e-mailadres */}
      {klanten.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-navy">Klant:</label>
          <input
            list={listId}
            placeholder="Klant zoeken → vult e-mail…"
            onChange={(e) => kiesKlant(e.target.value)}
            autoComplete="off"
            className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <datalist id={listId}>
            {klanten
              .filter((k) => k.email)
              .map((k) => (
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
          <input
            name="cc"
            placeholder="Cc (komma's tussen adressen)"
            className={inputCls}
          />
          <input
            name="bcc"
            placeholder="Bcc (komma's tussen adressen)"
            className={inputCls}
          />
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
        <RijkeEditor key={editorSleutel} beginHtml={editorHtml} />
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
