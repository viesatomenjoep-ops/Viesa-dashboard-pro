"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Braces,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Underline,
} from "lucide-react";
import { VARIABELEN } from "@/lib/variabelen";

type Tab = "bewerken" | "voorbeeld";

/**
 * Grote WYSIWYG-editor voor sjablonen, e-mails, offertes en audits. Geeft HTML
 * (`naamHtml`) en platte tekst (`naamTekst`) mee in het formulier. Ondersteunt
 * koppen/lijsten/links, het invoegen van variabelen ({{bedrijf}}…), een
 * fullscreen-modus en een Bewerken/Voorbeeld-schakelaar — fijn op mobiel.
 *
 * De opgemaakte HTML gebruikt dezelfde tags als de PDF-weergave (`.prose-viesa`),
 * zodat wat je typt overeenkomt met wat er uitkomt.
 */
export function GroteEditor({
  naamHtml = "html",
  naamTekst = "tekst",
  beginHtml = "",
  variabelen = true,
  minHoogte = 320,
}: {
  naamHtml?: string;
  naamTekst?: string;
  beginHtml?: string;
  variabelen?: boolean;
  minHoogte?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(beginHtml);
  const [tekst, setTekst] = useState("");
  const [vol, setVol] = useState(false);
  const [tab, setTab] = useState<Tab>("bewerken");
  const [varOpen, setVarOpen] = useState(false);

  function sync() {
    const el = ref.current;
    if (!el) return;
    setHtml(el.innerHTML);
    setTekst(el.innerText);
  }

  // Eén keer de platte tekst vullen vanuit de startinhoud (bv. een sjabloon).
  useEffect(() => {
    if (beginHtml) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape sluit de fullscreen-modus.
  useEffect(() => {
    if (!vol) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setVol(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [vol]);

  function opdracht(commando: string, waarde?: string) {
    ref.current?.focus();
    document.execCommand(commando, false, waarde);
    sync();
  }

  function voegLinkToe() {
    const url = window.prompt("Link naar welke URL?");
    if (url) opdracht("createLink", /^https?:\/\//i.test(url) ? url : `https://${url}`);
  }

  function voegVariabeleIn(sleutel: string) {
    ref.current?.focus();
    document.execCommand("insertText", false, `{{${sleutel}}}`);
    setVarOpen(false);
    sync();
  }

  // Het contentEditable-veld memoizen, anders overschrijft React bij elke
  // re-render de inhoud (zie geleerde les in CLAUDE.md).
  const editorVeld = useMemo(
    () => (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        role="textbox"
        aria-multiline="true"
        aria-label="Inhoud"
        className="prose-viesa flex-1 overflow-y-auto px-4 py-3 text-navy outline-none"
        style={{ minHeight: vol ? undefined : minHoogte }}
        dangerouslySetInnerHTML={{ __html: beginHtml }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beginHtml, vol, minHoogte],
  );

  const preview = (
    <div
      className="prose-viesa flex-1 overflow-y-auto bg-achtergrond px-4 py-3"
      style={{ minHeight: vol ? undefined : minHoogte }}
      dangerouslySetInnerHTML={{ __html: html || "<p class='text-navy/40'>Nog geen inhoud.</p>" }}
    />
  );

  return (
    <div
      className={
        vol
          ? "fixed inset-0 z-50 flex flex-col bg-white"
          : "flex flex-col overflow-hidden rounded-lg border border-navy/20 focus-within:border-navy"
      }
    >
      {/* Opmaakbalk */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-navy/10 bg-white px-2 py-1.5">
        <BlokKiezer onKies={(tag) => opdracht("formatBlock", tag)} />
        <Scheiding />
        <Knop titel="Vet" onClick={() => opdracht("bold")}>
          <Bold size={16} />
        </Knop>
        <Knop titel="Cursief" onClick={() => opdracht("italic")}>
          <Italic size={16} />
        </Knop>
        <Knop titel="Onderstrepen" onClick={() => opdracht("underline")}>
          <Underline size={16} />
        </Knop>
        <Scheiding />
        <Knop titel="Opsomming" onClick={() => opdracht("insertUnorderedList")}>
          <List size={16} />
        </Knop>
        <Knop titel="Genummerd" onClick={() => opdracht("insertOrderedList")}>
          <ListOrdered size={16} />
        </Knop>
        <Knop titel="Citaat" onClick={() => opdracht("formatBlock", "blockquote")}>
          <Quote size={16} />
        </Knop>
        <Knop titel="Link invoegen" onClick={voegLinkToe}>
          <Link2 size={16} />
        </Knop>
        <Knop titel="Opmaak wissen" onClick={() => opdracht("removeFormat")}>
          <Eraser size={16} />
        </Knop>

        {variabelen && (
          <div className="relative">
            <Scheiding />
            <button
              type="button"
              title="Variabele invoegen"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVarOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-navy/80 hover:bg-navy/10"
            >
              <Braces size={16} /> Variabele
            </button>
            {varOpen && (
              <div className="absolute left-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-navy/15 bg-white py-1 shadow-lg">
                {VARIABELEN.map((v) => (
                  <button
                    key={v.sleutel}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => voegVariabeleIn(v.sleutel)}
                    className="block w-full px-3 py-1.5 text-left text-sm text-navy hover:bg-navy/5"
                  >
                    {v.label} <span className="text-navy/40">{`{{${v.sleutel}}}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rechts: fullscreen */}
        <button
          type="button"
          title={vol ? "Fullscreen sluiten" : "Fullscreen"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVol((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-navy/70 hover:bg-navy/10"
        >
          {vol ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Bewerken / Voorbeeld */}
      <div className="flex border-b border-navy/10 bg-white text-sm">
        <TabKnop actief={tab === "bewerken"} onClick={() => setTab("bewerken")}>
          Bewerken
        </TabKnop>
        <TabKnop actief={tab === "voorbeeld"} onClick={() => setTab("voorbeeld")}>
          Voorbeeld
        </TabKnop>
      </div>

      {tab === "bewerken" ? editorVeld : preview}

      <input type="hidden" name={naamHtml} value={html} />
      <input type="hidden" name={naamTekst} value={tekst} />
    </div>
  );
}

function BlokKiezer({ onKies }: { onKies: (tag: string) => void }) {
  return (
    <select
      title="Tekststijl"
      defaultValue="p"
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        onKies(e.target.value);
        e.currentTarget.selectedIndex = 0;
      }}
      className="rounded px-1.5 py-1 text-sm text-navy/80 outline-none hover:bg-navy/10"
    >
      <option value="p">Tekst</option>
      <option value="h1">Kop 1</option>
      <option value="h2">Kop 2</option>
      <option value="h3">Kop 3</option>
    </select>
  );
}

function Knop({
  titel,
  onClick,
  children,
}: {
  titel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titel}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex items-center rounded px-1.5 py-1 text-navy/80 hover:bg-navy/10"
    >
      {children}
    </button>
  );
}

function TabKnop({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-medium ${
        actief ? "border-b-2 border-oranje text-navy" : "text-navy/50 hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function Scheiding() {
  return <span className="mx-1 h-5 w-px bg-navy/15" aria-hidden />;
}
