"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  TAAK_STATUSSEN,
  prioriteitToon,
  prioriteitLabel,
  persoonLabel,
  type Taak,
  type TaakStatus,
} from "@/lib/taken";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { datumKort } from "@/lib/format";
import { verplaatsTaak } from "./acties";

type Kolommen = Record<TaakStatus, Taak[]>;

function groepeer(taken: Taak[]): Kolommen {
  const start = Object.fromEntries(
    TAAK_STATUSSEN.map((s) => [s.key, [] as Taak[]]),
  ) as Kolommen;
  for (const taak of taken) (start[taak.status] ??= []).push(taak);
  return start;
}

export function TakenKanban({ taken }: { taken: Taak[] }) {
  const [kolommen, setKolommen] = useState<Kolommen>(() => groepeer(taken));
  const [actief, setActief] = useState<Taak | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    for (const s of TAAK_STATUSSEN) {
      const taak = kolommen[s.key].find((t) => t.id === id);
      if (taak) return setActief(taak);
    }
  }

  async function verplaats(taakId: string, doel: TaakStatus) {
    const bron = (Object.keys(kolommen) as TaakStatus[]).find((s) =>
      kolommen[s].some((t) => t.id === taakId),
    );
    if (!bron || bron === doel) return;

    const taak = kolommen[bron].find((t) => t.id === taakId)!;
    const positie = Math.max(0, ...kolommen[doel].map((t) => t.positie)) + 1;
    const verplaatst = { ...taak, status: doel, positie };

    setKolommen((prev) => ({
      ...prev,
      [bron]: prev[bron].filter((t) => t.id !== taakId),
      [doel]: [...prev[doel], verplaatst],
    }));

    const res = await verplaatsTaak(taakId, doel, positie);
    if (res && !res.ok) {
      setKolommen((prev) => ({
        ...prev,
        [doel]: prev[doel].filter((t) => t.id !== taakId),
        [bron]: [...prev[bron], taak],
      }));
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActief(null);
    const { active, over } = e;
    if (!over) return;
    const doel = over.id as TaakStatus;
    if (!TAAK_STATUSSEN.some((s) => s.key === doel)) return;
    void verplaats(String(active.id), doel);
  }

  // Dubbelklik → volgende status (todo → bezig → review → klaar → todo).
  function volgende(taak: Taak) {
    const idx = TAAK_STATUSSEN.findIndex((s) => s.key === taak.status);
    const doel = TAAK_STATUSSEN[(idx + 1) % TAAK_STATUSSEN.length].key;
    void verplaats(taak.id, doel);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <p className="mb-3 text-xs text-navy/45">
        Sleep tussen de kolommen · <span className="font-medium text-navy/60">dubbelklik</span> om de status te wijzigen.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TAAK_STATUSSEN.map((s) => (
          <Kolom key={s.key} status={s.key} label={s.label} taken={kolommen[s.key]} onVolgende={volgende} />
        ))}
      </div>
      <DragOverlay>{actief ? <Kaartje taak={actief} sleep /> : null}</DragOverlay>
    </DndContext>
  );
}

function Kolom({
  status,
  label,
  taken,
  onVolgende,
}: {
  status: TaakStatus;
  label: string;
  taken: Taak[];
  onVolgende: (taak: Taak) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[15rem] shrink-0 flex-col rounded-xl border p-3 transition-colors sm:w-64 ${
        isOver ? "border-oranje/40 bg-oranje/5" : "border-navy/10 bg-white/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-navy">
          {label}
          <span className="ml-1.5 text-navy/40">{taken.length}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {taken.map((taak) => (
          <SleepbaarKaartje key={taak.id} taak={taak} onVolgende={onVolgende} />
        ))}
        {taken.length === 0 && (
          <div className="rounded-lg border border-dashed border-navy/15 py-6 text-center text-xs text-navy/40">
            Sleep hierheen
          </div>
        )}
      </div>
    </div>
  );
}

function SleepbaarKaartje({ taak, onVolgende }: { taak: Taak; onVolgende: (taak: Taak) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: taak.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onVolgende(taak)}
      className={isDragging ? "opacity-40" : ""}
    >
      <Kaartje taak={taak} />
    </div>
  );
}

function Kaartje({ taak, sleep = false }: { taak: Taak; sleep?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-navy/10 bg-white p-3 shadow-sm ${
        sleep ? "rotate-1 shadow-md" : ""
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Badge toon={prioriteitToon(taak.prioriteit)}>{prioriteitLabel(taak.prioriteit)}</Badge>
        {taak.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-navy/5 px-2 py-0.5 text-xs font-medium text-navy/60"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="text-sm font-medium text-navy">{taak.titel}</p>
      {taak.klant_naam && <p className="mt-1 text-xs text-navy/50">{taak.klant_naam}</p>}
      <div className="mt-2 flex items-center gap-2">
        <Avatar naam={persoonLabel(taak.wie)} size={22} />
        <span className="text-xs text-navy/50">{persoonLabel(taak.wie)}</span>
        {taak.deadline && (
          <span className="ml-auto text-xs text-navy/40">{datumKort(taak.deadline)}</span>
        )}
      </div>
    </div>
  );
}
