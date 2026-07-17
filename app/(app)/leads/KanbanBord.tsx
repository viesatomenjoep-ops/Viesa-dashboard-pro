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
  LEAD_STATUSSEN,
  scoreToon,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { euro } from "@/lib/format";
import { verplaatsLead } from "./acties";

type Kolommen = Record<LeadStatus, Lead[]>;

function groepeer(leads: Lead[]): Kolommen {
  const start = Object.fromEntries(
    LEAD_STATUSSEN.map((s) => [s.key, [] as Lead[]]),
  ) as Kolommen;
  for (const lead of leads) (start[lead.status] ??= []).push(lead);
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
    for (const s of LEAD_STATUSSEN) {
      const lead = kolommen[s.key].find((l) => l.id === id);
      if (lead) return setActief(lead);
    }
  }

  async function verplaats(leadId: string, doel: LeadStatus) {
    const bron = (Object.keys(kolommen) as LeadStatus[]).find((s) =>
      kolommen[s].some((l) => l.id === leadId),
    );
    if (!bron || bron === doel) return;

    const lead = kolommen[bron].find((l) => l.id === leadId)!;
    const positie = Math.max(0, ...kolommen[doel].map((l) => l.positie)) + 1;
    const verplaatst = { ...lead, status: doel, positie };

    setKolommen((prev) => ({
      ...prev,
      [bron]: prev[bron].filter((l) => l.id !== leadId),
      [doel]: [...prev[doel], verplaatst],
    }));

    const res = await verplaatsLead(leadId, doel, positie);
    if (res && !res.ok) {
      setKolommen((prev) => ({
        ...prev,
        [doel]: prev[doel].filter((l) => l.id !== leadId),
        [bron]: [...prev[bron], lead],
      }));
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActief(null);
    const { active, over } = e;
    if (!over) return;
    const doel = over.id as LeadStatus;
    if (!LEAD_STATUSSEN.some((s) => s.key === doel)) return;
    void verplaats(String(active.id), doel);
  }

  // Dubbelklik → volgende status (nieuw → contact → audit/offerte → gewonnen).
  function volgende(lead: Lead) {
    const idx = LEAD_STATUSSEN.findIndex((s) => s.key === lead.status);
    const doel = LEAD_STATUSSEN[(idx + 1) % LEAD_STATUSSEN.length].key;
    void verplaats(lead.id, doel);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <p className="mb-3 text-xs text-navy/45">
        Sleep tussen de kolommen · <span className="font-medium text-navy/60">dubbelklik</span> om de status te wijzigen.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STATUSSEN.map((s) => (
          <Kolom key={s.key} status={s.key} label={s.label} leads={kolommen[s.key]} onVolgende={volgende} />
        ))}
      </div>
      <DragOverlay>{actief ? <Kaartje lead={actief} sleep /> : null}</DragOverlay>
    </DndContext>
  );
}

function Kolom({
  status,
  label,
  leads,
  onVolgende,
}: {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  onVolgende: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const totaal = leads.reduce((s, l) => s + Number(l.verwachte_waarde || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[13rem] shrink-0 flex-col rounded-xl border p-2.5 transition-colors sm:w-64 ${
        isOver ? "border-oranje/40 bg-oranje/5" : "border-navy/10 bg-white/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-navy">
          {label}
          <span className="ml-1.5 text-navy/40">{leads.length}</span>
        </span>
        {totaal > 0 && <span className="text-xs text-navy/50">{euro(totaal)}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {leads.map((lead) => (
          <SleepbaarKaartje key={lead.id} lead={lead} onVolgende={onVolgende} />
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

function SleepbaarKaartje({ lead, onVolgende }: { lead: Lead; onVolgende: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onVolgende(lead)}
      className={isDragging ? "opacity-40" : ""}
    >
      <Kaartje lead={lead} />
    </div>
  );
}

function Kaartje({ lead, sleep = false }: { lead: Lead; sleep?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-navy/10 bg-white p-3 shadow-sm ${
        sleep ? "rotate-1 shadow-md" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Avatar naam={lead.bedrijf} size={28} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/leads/${lead.id}`}
            className="block truncate text-sm font-medium text-navy hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {lead.bedrijf}
          </Link>
          {lead.plaats && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-navy/50">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{lead.plaats}</span>
            </p>
          )}
        </div>
        <Badge toon={scoreToon(lead.score)}>{lead.score}</Badge>
      </div>
      {lead.verwachte_waarde > 0 && (
        <p className="mt-2 text-xs font-medium text-navy/70">
          {euro(lead.verwachte_waarde)}
        </p>
      )}
    </div>
  );
}
