"use client";

import { useState } from "react";
import Link from "next/link";
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
  LEAD_STAGES,
  scoreToon,
  type Lead,
  type LeadStage,
} from "@/lib/leads";
import { Badge } from "@/components/ui/Badge";
import { euro } from "@/lib/format";
import { verplaatsLead } from "./acties";

type Kolommen = Record<LeadStage, Lead[]>;

function groepeer(leads: Lead[]): Kolommen {
  const start = Object.fromEntries(
    LEAD_STAGES.map((s) => [s.key, [] as Lead[]]),
  ) as Kolommen;
  for (const lead of leads) start[lead.stage]?.push(lead);
  return start;
}

export function KanbanBord({ leads }: { leads: Lead[] }) {
  const [kolommen, setKolommen] = useState<Kolommen>(() => groepeer(leads));
  const [actief, setActief] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    for (const stage of LEAD_STAGES) {
      const lead = kolommen[stage.key].find((l) => l.id === id);
      if (lead) return setActief(lead);
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    setActief(null);
    const { active, over } = e;
    if (!over) return;

    const leadId = String(active.id);
    const doelStage = over.id as LeadStage;
    if (!LEAD_STAGES.some((s) => s.key === doelStage)) return;

    // Vind de bronkolom.
    const bronStage = (Object.keys(kolommen) as LeadStage[]).find((s) =>
      kolommen[s].some((l) => l.id === leadId),
    );
    if (!bronStage || bronStage === doelStage) return;

    const lead = kolommen[bronStage].find((l) => l.id === leadId)!;
    const nieuwePositie =
      Math.max(0, ...kolommen[doelStage].map((l) => l.positie)) + 1;
    const verplaatst = { ...lead, stage: doelStage, positie: nieuwePositie };

    // Optimistisch bijwerken.
    setKolommen((prev) => ({
      ...prev,
      [bronStage]: prev[bronStage].filter((l) => l.id !== leadId),
      [doelStage]: [...prev[doelStage], verplaatst],
    }));

    const res = await verplaatsLead(leadId, doelStage, nieuwePositie);
    if (res && !res.ok) {
      // Terugdraaien bij fout.
      setKolommen((prev) => ({
        ...prev,
        [doelStage]: prev[doelStage].filter((l) => l.id !== leadId),
        [bronStage]: [...prev[bronStage], lead],
      }));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES.map((stage) => (
          <Kolom
            key={stage.key}
            stage={stage.key}
            label={stage.label}
            leads={kolommen[stage.key]}
          />
        ))}
      </div>
      <DragOverlay>
        {actief ? <Kaartje lead={actief} sleep /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Kolom({
  stage,
  label,
  leads,
}: {
  stage: LeadStage;
  label: string;
  leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totaal = leads.reduce((s, l) => s + Number(l.geschatte_waarde || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
        isOver ? "border-oranje/40 bg-oranje/5" : "border-navy/10 bg-white/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-navy">
          {label}
          <span className="ml-1.5 text-navy/40">{leads.length}</span>
        </span>
        {totaal > 0 && (
          <span className="text-xs text-navy/50">{euro(totaal)}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {leads.map((lead) => (
          <SleepbaarKaartje key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-lg border border-dashed border-navy/15 py-6 text-center text-xs text-navy/40">
            Sleep hierheen
          </div>
        )}
      </div>
    </div>
  );
}

function SleepbaarKaartje({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-40" : ""}
    >
      <Kaartje lead={lead} />
    </div>
  );
}

function Kaartje({ lead, sleep = false }: { lead: Lead; sleep?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-navy/10 bg-white p-3 shadow-sm ${
        sleep ? "rotate-1 shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="text-sm font-medium text-navy hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.bedrijfsnaam}
        </Link>
        <Badge toon={scoreToon(lead.score)}>{lead.score}</Badge>
      </div>
      {lead.website && (
        <p className="mt-1 truncate text-xs text-navy/50">{lead.website}</p>
      )}
      {lead.geschatte_waarde > 0 && (
        <p className="mt-2 text-xs font-medium text-navy/70">
          {euro(lead.geschatte_waarde)}
        </p>
      )}
    </div>
  );
}
