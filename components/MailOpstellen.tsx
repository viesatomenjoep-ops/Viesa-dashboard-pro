"use client";

import { useState } from "react";
import { GroteEditor } from "@/components/GroteEditor";
import { ZoekKies } from "@/components/ZoekKies";
import { contextVanKlant, vulVariabelen, type VariabeleContext } from "@/lib/variabelen";
import { STANDAARD_LETTERTYPE } from "@/lib/lettertypes";

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
  /** Het lettertype dat bij dit sjabloon hoort (sleutel uit lib/lettertypes.ts). */
  lettertype?: string | null;
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
  const [klantZoek, setKlantZoek] = useState("");
  const [lettertype, setLettertype] = useState(STANDAARD_LETTERTYPE);

  // Bekende e-mailadressen uit het klantenbestand (uniek, gesorteerd) — voor het
  // automatisch aanvullen van het Aan-veld.
  const bekendeAdressen = Array.from(
    new Map(
      klanten
        .filter((k) => k.email && k.email.includes("@"))
        .map((k) => [k.email!.toLowerCase(), { email: k.email!, bedrijf: k.bedrijf }]),
    ).values(),
  ).sort((a, b) => a.email.localeCompare(b.email));

  function pasSjabloonToe(id: string, context: VariabeleContext) {
    const s = sjablonen.find((x) => x.id === id);
    if (!s) return;
    setOnderwerp(vulVariabelen(s.onderwerp ?? "", context, false));
    setEditorHtml(vulVariabelen(s.inhoud_html, context));
    // Een sjabloon mag zijn eigen lettertype meebrengen; anders de standaard.
    setLettertype(s.lettertype || STANDAARD_LETTERTYPE);
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
    <form
      action={verstuurActie}
      onSubmit={(e) => {
        if (!window.confirm("Weet u zeker dat u deze e-mail wilt versturen?")) {
          e.preventDefault();
        }
      }}
    >
      <div className="mb-3">
        <SjabloonKiezer
          sjablonen={sjablonen}
          gekozenId={sjabloonId}
          onKies={kiesSjabloon}
        />
      </div>

      {/* Klant kiezen → live suggesties; vult e-mailadres én variabelen */}
      {klanten.length > 0 && (
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-navy">Klant</label>
          <ZoekKies
            value={klantZoek}
            onChange={setKlantZoek}
            onKies={(o) => kiesKlant(o.waarde)}
            opties={klanten.map((k) => ({ waarde: k.bedrijf, sub: k.email ?? undefined }))}
            placeholder="Klant zoeken → vult e-mail + variabelen…"
            className={`${inputCls}`}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 items-start gap-2">
          {/* Aan-veld met live e-mailsuggesties uit het klantenbestand */}
          <div className="min-w-0 flex-1">
            <ZoekKies
              name="naar"
              type="email"
              required
              value={naar}
              onChange={setNaar}
              onKies={(o) => setNaar(o.waarde)}
              opties={bekendeAdressen.map((a) => ({ waarde: a.email, sub: a.bedrijf }))}
              placeholder="Aan (ontvanger) *"
              className={inputCls}
            />
          </div>
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
        <GroteEditor
          key={editorSleutel}
          beginHtml={editorHtml}
          beginLettertype={lettertype}
        />
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

/**
 * Sjabloonkiezer voor het mailvenster.
 *
 * Bewust géén uitklaplijst: met tientallen sjablonen zie je in zo'n lijst alleen
 * namen, en moet je gokken wat erin staat. Hier zoek je op naam én onderwerp, en
 * zie je van elk sjabloon meteen de onderwerpregel eronder staan.
 *
 * De lijst staat dicht zodra er een sjabloon gekozen is — anders duwt hij het
 * eigenlijke bericht van het scherm.
 */
function SjabloonKiezer({
  sjablonen,
  gekozenId,
  onKies,
}: {
  sjablonen: MailSjabloon[];
  gekozenId: string;
  onKies: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [zoek, setZoek] = useState("");

  const gekozen = sjablonen.find((s) => s.id === gekozenId) ?? null;
  const term = zoek.toLowerCase().trim();
  const gevonden = term
    ? sjablonen.filter((s) =>
        `${s.naam} ${s.onderwerp ?? ""}`.toLowerCase().includes(term),
      )
    : sjablonen;

  if (sjablonen.length === 0) {
    return (
      <p className="text-xs text-navy/40">
        Nog geen sjablonen — importeer ze bij Sjablonen met “Standaard importeren”.
      </p>
    );
  }

  function kies(id: string) {
    onKies(id);
    setOpen(false);
    setZoek("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="shrink-0 text-sm font-medium text-navy">Sjabloon:</label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 truncate rounded-lg border border-navy/20 px-3 py-2 text-left text-sm text-navy hover:bg-navy/[0.02] focus:border-navy"
        >
          {gekozen ? gekozen.naam : "Leeg bericht — kies een sjabloon"}
        </button>
        {gekozen && (
          <button
            type="button"
            onClick={() => kies("")}
            className="rounded-lg border border-navy/15 px-2.5 py-2 text-xs text-navy/60 hover:bg-navy/5"
          >
            Wissen
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 overflow-hidden rounded-lg border border-navy/15 bg-white">
          <input
            autoFocus
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder={`Zoek in ${sjablonen.length} sjablonen — op naam of onderwerp`}
            className="w-full border-b border-navy/10 px-3 py-2 text-sm text-navy outline-none"
          />
          <ul className="max-h-80 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => kies("")}
                className="block w-full px-3 py-2 text-left text-sm text-navy/60 hover:bg-navy/5"
              >
                Leeg bericht
              </button>
            </li>
            {gevonden.map((s) => (
              <li key={s.id} className="border-t border-navy/5">
                <button
                  type="button"
                  onClick={() => kies(s.id)}
                  className={`block w-full px-3 py-2 text-left hover:bg-navy/5 ${
                    s.id === gekozenId ? "bg-navy/5" : ""
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-navy">
                    {s.naam}
                  </span>
                  {s.onderwerp && (
                    <span className="block truncate text-xs text-navy/50">
                      {s.onderwerp}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {gevonden.length === 0 && (
              <li className="px-3 py-3 text-sm text-navy/40">
                Niets gevonden voor “{zoek}”.
              </li>
            )}
          </ul>
        </div>
      )}

      <p className="mt-1 text-xs text-navy/40">
        Vult onderwerp + bericht; kies ook een klant om de variabelen in te vullen.
      </p>
    </div>
  );
}
