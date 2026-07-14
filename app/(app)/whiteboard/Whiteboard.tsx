"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  maakNote,
  werkNotePositie,
  werkNoteTekst,
  werkNoteKleur,
  verwijderNote,
  type StickyNote,
} from "./acties";

// Vier vaste kleuren: geel, oranje, blauw, groen.
const KLEUREN = ["#FDE68A", "#FDBA74", "#BFDBFE", "#BBF7D0"];

export function Whiteboard({
  whiteboardId,
  beginNotes,
}: {
  whiteboardId: string;
  beginNotes: StickyNote[];
}) {
  const [notes, setNotes] = useState<StickyNote[]>(beginNotes);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  async function voegToe() {
    const x = 40 + Math.round((notes.length % 5) * 24);
    const y = 40 + Math.round((notes.length % 5) * 24);
    const note = await maakNote(whiteboardId, x, y);
    if (note) setNotes((n) => [...n, note]);
  }

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const x = Math.max(0, n.x + e.delta.x);
        const y = Math.max(0, n.y + e.delta.y);
        werkNotePositie(id, x, y);
        return { ...n, x, y };
      }),
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={voegToe}
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Sticky note
        </button>
        <span className="text-sm text-navy/50">
          Sleep aan de bovenrand · dubbelklik om te typen.
        </span>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div
          className="relative h-[70vh] overflow-auto rounded-xl border border-navy/10"
          style={{
            backgroundImage: "radial-gradient(rgba(25,68,91,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundColor: "#fff",
          }}
        >
          {notes.map((note) => (
            <NoteKaart
              key={note.id}
              note={note}
              onTekst={(t) =>
                setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, tekst: t } : x)))
              }
              onKleur={(k) =>
                setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, kleur: k } : x)))
              }
              onVerwijder={() => setNotes((n) => n.filter((x) => x.id !== note.id))}
            />
          ))}
          {notes.length === 0 && (
            <p className="p-8 text-sm text-navy/40">
              Nog geen notes. Voeg er één toe met de knop hierboven.
            </p>
          )}
        </div>
      </DndContext>
    </div>
  );
}

function NoteKaart({
  note,
  onTekst,
  onKleur,
  onVerwijder,
}: {
  note: StickyNote;
  onTekst: (t: string) => void;
  onKleur: (k: string) => void;
  onVerwijder: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: note.id });
  const [bewerk, setBewerk] = useState(false);
  const dx = transform?.x ?? 0;
  const dy = transform?.y ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: note.x + dx,
        top: note.y + dy,
        width: note.breedte,
        height: note.hoogte,
        backgroundColor: note.kleur,
      }}
      className="flex flex-col rounded-md shadow-md"
    >
      <div
        {...listeners}
        {...attributes}
        className="flex cursor-grab items-center justify-between rounded-t-md px-2 py-1"
      >
        <div className="flex gap-1">
          {KLEUREN.map((k) => (
            <button
              key={k}
              onClick={() => {
                onKleur(k);
                werkNoteKleur(note.id, k);
              }}
              style={{ backgroundColor: k }}
              className="h-3 w-3 rounded-full border border-black/10"
              aria-label="kleur"
            />
          ))}
        </div>
        <button
          onClick={() => {
            onVerwijder();
            verwijderNote(note.id);
          }}
          className="text-black/40 hover:text-black/70"
          aria-label="verwijderen"
        >
          ×
        </button>
      </div>

      {bewerk ? (
        <textarea
          autoFocus
          defaultValue={note.tekst}
          onChange={(e) => onTekst(e.target.value)}
          onBlur={(e) => {
            werkNoteTekst(note.id, e.target.value);
            setBewerk(false);
          }}
          className="flex-1 resize-none rounded-b-md bg-transparent p-2 text-sm text-navy outline-none"
        />
      ) : (
        <div
          onDoubleClick={() => setBewerk(true)}
          className="flex-1 whitespace-pre-wrap p-2 text-sm text-navy"
        >
          {note.tekst || <span className="text-navy/30">Dubbelklik om te typen…</span>}
        </div>
      )}
    </div>
  );
}
