"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lichte rich-text editor (WYSIWYG) voor het opstellen van e-mails. Geen externe
 * afhankelijkheid: een contentEditable met een opmaakbalk. De opgemaakte HTML en
 * de platte tekst worden in verborgen velden meegepost (`naamHtml`/`naamTekst`),
 * zodat de bestaande formulier-flow blijft werken.
 */
export function RijkeEditor({
  naamHtml = "html",
  naamTekst = "tekst",
  beginHtml = "",
}: {
  naamHtml?: string;
  naamTekst?: string;
  beginHtml?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(beginHtml);
  const [tekst, setTekst] = useState("");

  function sync() {
    const el = ref.current;
    if (!el) return;
    setHtml(el.innerHTML);
    setTekst(el.innerText);
  }

  // Vul de platte tekst één keer vanuit de startinhoud (bv. een sjabloon),
  // zodat ook een onbewerkt sjabloon een gevulde tekst-variant meepost.
  useEffect(() => {
    if (beginHtml) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function opdracht(commando: string, waarde?: string) {
    // Ouderwets maar overal ondersteund en dependency-vrij; prima voor een
    // interne editor. De contentEditable moet focus hebben vóór het commando.
    ref.current?.focus();
    document.execCommand(commando, false, waarde);
    sync();
  }

  function voegLinkToe() {
    const url = window.prompt("Link naar welke URL?");
    if (url) opdracht("createLink", /^https?:\/\//i.test(url) ? url : `https://${url}`);
  }

  // Belangrijk: het contentEditable-element wordt gememoized. Zonder memo
  // paste React bij elke re-render (bv. typen in het onderwerp-veld, of de
  // eigen state-sync hieronder) de `dangerouslySetInnerHTML` opnieuw toe en
  // werd alles wat je aan het typen was gewist. Een identiek element-object
  // slaat React bij het diffen volledig over, dus de DOM blijft met rust.
  const editorVeld = useMemo(
    () => (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        role="textbox"
        aria-multiline="true"
        aria-label="Berichttekst"
        className="min-h-[240px] px-3 py-3 text-sm leading-relaxed text-navy outline-none [&_a]:text-oranje [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: beginHtml }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beginHtml],
  );

  return (
    <div className="rounded-lg border border-navy/20 focus-within:border-navy">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-navy/10 px-2 py-1.5">
        <Knop titel="Vet" onClick={() => opdracht("bold")}>
          <span className="font-bold">B</span>
        </Knop>
        <Knop titel="Cursief" onClick={() => opdracht("italic")}>
          <span className="italic">I</span>
        </Knop>
        <Knop titel="Onderstrepen" onClick={() => opdracht("underline")}>
          <span className="underline">U</span>
        </Knop>
        <Scheiding />
        <Knop titel="Opsomming" onClick={() => opdracht("insertUnorderedList")}>
          • Lijst
        </Knop>
        <Knop titel="Genummerd" onClick={() => opdracht("insertOrderedList")}>
          1. Lijst
        </Knop>
        <Scheiding />
        <Knop titel="Link invoegen" onClick={voegLinkToe}>
          🔗 Link
        </Knop>
        <Knop titel="Opmaak wissen" onClick={() => opdracht("removeFormat")}>
          Wis opmaak
        </Knop>
      </div>
      {editorVeld}
      <input type="hidden" name={naamHtml} value={html} />
      <input type="hidden" name={naamTekst} value={tekst} />
    </div>
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
      // Voorkomt dat de knop de focus (en daarmee de tekstselectie in de
      // editor) steelt — anders doet bv. "Vet" niets op geselecteerde tekst.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded px-2 py-1 text-sm text-navy/80 hover:bg-navy/10"
    >
      {children}
    </button>
  );
}

function Scheiding() {
  return <span className="mx-1 h-5 w-px bg-navy/15" aria-hidden />;
}
