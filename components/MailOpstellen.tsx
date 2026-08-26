"use client";

import { useState, useTransition } from "react";
import { Loader2, Paperclip, Star, X } from "lucide-react";
import { GroteEditor } from "@/components/GroteEditor";
import { ZoekKies } from "@/components/ZoekKies";
import { contextVanKlant, vulVariabelen, type VariabeleContext } from "@/lib/variabelen";
import { STANDAARD_LETTERTYPE } from "@/lib/lettertypes";
import type { ScanRapport } from "@/lib/scan";

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
  /** Favoriet: staat bovenaan in de kiezer (migratie 0043). */
  favoriet?: boolean | null;
};

type FavorietActie = (
  id: string,
  favoriet: boolean,
) => Promise<{ ok: boolean; fout?: string }>;

/** Een bewaard scanrapport (activiteit type 'rapport') — kandidaat om als PDF bij te voegen. */
export type MailRapport = {
  id: string;
  titel: string;
  bedrijf: string | null;
  created_at: string;
  data: ScanRapport;
};

type Bijlage = { filename: string; content: string };

/** Leest een lokaal bestand als base64 (zonder het data:-voorvoegsel). */
function bestandNaarBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Kon bestand niet lezen."));
    reader.readAsDataURL(file);
  });
}

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
  favorietActie,
  rapporten = [],
  initieelNaar = "",
  initieelOnderwerp = "",
}: {
  verstuurActie: (formData: FormData) => void;
  geconfigureerd: boolean;
  klanten?: KlantOptie[];
  sjablonen?: MailSjabloon[];
  favorietActie?: FavorietActie;
  /** Bewaarde scanrapporten — om als PDF-bijlage toe te voegen. */
  rapporten?: MailRapport[];
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
  const [bijlagen, setBijlagen] = useState<Bijlage[]>([]);
  const [rapportId, setRapportId] = useState("");
  const [bijlageBezig, setBijlageBezig] = useState(false);
  const [bijlageFout, setBijlageFout] = useState<string | null>(null);

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

  async function voegBestandToe(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBijlageBezig(true);
    setBijlageFout(null);
    try {
      const nieuw: Bijlage[] = [];
      for (const file of Array.from(files)) {
        nieuw.push({ filename: file.name, content: await bestandNaarBase64(file) });
      }
      setBijlagen((v) => [...v, ...nieuw]);
    } catch (e) {
      setBijlageFout(e instanceof Error ? e.message : "Bestand kon niet worden toegevoegd.");
    } finally {
      setBijlageBezig(false);
    }
  }

  async function voegRapportToe(id: string) {
    const r = rapporten.find((x) => x.id === id);
    setRapportId("");
    if (!r) return;
    setBijlageBezig(true);
    setBijlageFout(null);
    try {
      const [{ pdf }, { ScanPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/ScanPDFDocument"),
      ]);
      const blob = await pdf(<ScanPDFDocument rapport={r.data} />).toBlob();
      const content = await bestandNaarBase64(new File([blob], "rapport.pdf"));
      const datum = r.created_at.slice(0, 10);
      const filename = `websitescan-${r.data.host}-${datum}.pdf`;
      setBijlagen((v) => [...v, { filename, content }]);
    } catch (e) {
      setBijlageFout(e instanceof Error ? e.message : "Rapport kon niet worden toegevoegd.");
    } finally {
      setBijlageBezig(false);
    }
  }

  function verwijderBijlage(i: number) {
    setBijlagen((v) => v.filter((_, idx) => idx !== i));
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
          favorietActie={favorietActie}
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

      {/* Bijlagen */}
      <input type="hidden" name="bijlagen" value={JSON.stringify(bijlagen)} />
      <div className="mt-3 border-t border-navy/10 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5">
            <Paperclip size={13} /> Bijlage toevoegen
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                voegBestandToe(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {rapporten.length > 0 && (
            <select
              value={rapportId}
              onChange={(e) => voegRapportToe(e.target.value)}
              className="rounded-lg border border-navy/20 px-2 py-1.5 text-xs text-navy outline-none focus:border-navy"
            >
              <option value="">Rapport bijvoegen…</option>
              {rapporten.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.bedrijf ?? "Onbekende lead"} — {r.titel} ({r.created_at.slice(0, 10)})
                </option>
              ))}
            </select>
          )}
          {bijlageBezig && <Loader2 size={14} className="animate-spin text-navy/40" />}
        </div>

        {bijlageFout && <p className="mt-1.5 text-xs text-red-600">{bijlageFout}</p>}

        {bijlagen.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {bijlagen.map((b, i) => (
              <li
                key={`${b.filename}-${i}`}
                className="flex items-center gap-1.5 rounded-lg border border-navy/15 bg-navy/[0.02] px-2.5 py-1 text-xs text-navy"
              >
                <Paperclip size={12} className="text-navy/40" />
                <span className="max-w-[220px] truncate">{b.filename}</span>
                <button
                  type="button"
                  onClick={() => verwijderBijlage(i)}
                  className="text-navy/40 hover:text-red-600"
                  aria-label={`${b.filename} verwijderen`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
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
 * Bewust géén uitklaplijst: met ruim vijftig sjablonen zie je in zo'n lijst
 * alleen namen, en moet je gokken wat erin staat. Hier zoek je op naam én
 * onderwerp, en zie je van elk sjabloon meteen de onderwerpregel eronder.
 *
 * Favorieten staan bovenaan in een eigen kopje, en je kunt ze hier ook meteen
 * aan- en uitzetten — juist tijdens het schrijven merk je welk sjabloon werkt.
 * De ster schakelt direct om en draait terug als de server het weigert.
 */
function SjabloonKiezer({
  sjablonen,
  gekozenId,
  onKies,
  favorietActie,
}: {
  sjablonen: MailSjabloon[];
  gekozenId: string;
  onKies: (id: string) => void;
  favorietActie?: FavorietActie;
}) {
  const [open, setOpen] = useState(false);
  const [zoek, setZoek] = useState("");
  const [alleenFavorieten, setAlleenFavorieten] = useState(false);
  // Lokale overschrijving van de sterstatus, zodat een klik direct zichtbaar is
  // zonder de hele pagina te herladen (en je concept dus intact blijft).
  const [sterren, setSterren] = useState<Record<string, boolean>>({});
  const [bezig, start] = useTransition();

  const isFavoriet = (s: MailSjabloon) => sterren[s.id] ?? Boolean(s.favoriet);

  const gekozen = sjablonen.find((s) => s.id === gekozenId) ?? null;
  const term = zoek.toLowerCase().trim();

  const gevonden = sjablonen
    .filter((s) => (alleenFavorieten ? isFavoriet(s) : true))
    .filter((s) =>
      term ? `${s.naam} ${s.onderwerp ?? ""}`.toLowerCase().includes(term) : true,
    );

  const favorieten = gevonden.filter(isFavoriet);
  const overige = gevonden.filter((s) => !isFavoriet(s));
  const aantalFavoriet = sjablonen.filter(isFavoriet).length;

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

  function wisselSter(s: MailSjabloon) {
    if (!favorietActie) return;
    const nieuw = !isFavoriet(s);
    setSterren((v) => ({ ...v, [s.id]: nieuw }));
    start(async () => {
      const r = await favorietActie(s.id, nieuw);
      if (!r.ok) {
        setSterren((v) => ({ ...v, [s.id]: !nieuw }));
        if (r.fout) window.alert(r.fout);
      }
    });
  }

  function rij(s: MailSjabloon) {
    const ster = isFavoriet(s);
    return (
      <li key={s.id} className="flex items-center gap-1 border-t border-navy/5">
        {favorietActie && (
          <button
            type="button"
            onClick={() => wisselSter(s)}
            disabled={bezig}
            aria-label={ster ? "Uit favorieten halen" : "Als favoriet markeren"}
            aria-pressed={ster}
            className={`shrink-0 pl-3 ${
              ster ? "text-amber-500" : "text-navy/20 hover:text-amber-500"
            } disabled:opacity-50`}
          >
            <Star size={15} fill={ster ? "currentColor" : "none"} />
          </button>
        )}
        <button
          type="button"
          onClick={() => kies(s.id)}
          className={`block min-w-0 flex-1 px-3 py-2 text-left hover:bg-navy/5 ${
            s.id === gekozenId ? "bg-navy/5" : ""
          }`}
        >
          <span className="block truncate text-sm font-medium text-navy">{s.naam}</span>
          {s.onderwerp && (
            <span className="block truncate text-xs text-navy/50">{s.onderwerp}</span>
          )}
        </button>
      </li>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="shrink-0 text-sm font-medium text-navy">Sjabloon:</label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-2 text-left text-sm text-navy hover:bg-navy/[0.02] focus:border-navy"
        >
          {gekozen && isFavoriet(gekozen) && (
            <Star size={14} className="shrink-0 text-amber-500" fill="currentColor" />
          )}
          <span className="truncate">
            {gekozen ? gekozen.naam : "Leeg bericht — kies een sjabloon"}
          </span>
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
          <div className="flex items-center gap-2 border-b border-navy/10 px-2 py-1.5">
            <input
              autoFocus
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder={`Zoek in ${sjablonen.length} sjablonen — op naam of onderwerp`}
              className="min-w-0 flex-1 px-1 py-1 text-sm text-navy outline-none"
            />
            <button
              type="button"
              onClick={() => setAlleenFavorieten((v) => !v)}
              aria-pressed={alleenFavorieten}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                alleenFavorieten
                  ? "bg-amber-100 text-amber-800"
                  : "text-navy/60 hover:bg-navy/5"
              }`}
            >
              <Star
                size={13}
                fill={alleenFavorieten ? "currentColor" : "none"}
              />
              Favorieten ({aantalFavoriet})
            </button>
          </div>

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

            {favorieten.length > 0 && (
              <li className="border-t border-navy/5 bg-amber-50/60 px-3 py-1 text-xs font-medium text-amber-800">
                Favorieten
              </li>
            )}
            {favorieten.map(rij)}

            {overige.length > 0 && favorieten.length > 0 && (
              <li className="border-t border-navy/5 bg-navy/[0.03] px-3 py-1 text-xs font-medium text-navy/50">
                Overige
              </li>
            )}
            {overige.map(rij)}

            {gevonden.length === 0 && (
              <li className="px-3 py-3 text-sm text-navy/40">
                {alleenFavorieten && aantalFavoriet === 0
                  ? "Nog geen favorieten — klik op een ster om er een te maken."
                  : `Niets gevonden voor “${zoek}”.`}
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
