"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Categorie-filterchips die je van links naar rechts kunt slepen om te
 * herordenen, en met een × (na bevestiging) kunt verwijderen.
 */
export function CategorieChips({
  categorieen,
  actief,
  bewaarVolgordeActie,
  verwijderActie,
}: {
  categorieen: string[];
  actief?: string;
  bewaarVolgordeActie: (namen: string[]) => void;
  verwijderActie: (naam: string) => void;
}) {
  const [volgorde, setVolgorde] = useState(categorieen);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDelete(naam: string) {
    if (!window.confirm(`Wil je de categorie "${naam}" verwijderen?`)) return;
    setVolgorde((v) => v.filter((n) => n !== naam));
    verwijderActie(naam);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setVolgorde((v) => {
        const nieuw = arrayMove(v, v.indexOf(String(active.id)), v.indexOf(String(over.id)));
        bewaarVolgordeActie(nieuw);
        return nieuw;
      });
    }
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <FilterLink actief={!actief} label="Alle" href="/bestanden" />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={volgorde} strategy={horizontalListSortingStrategy}>
          {volgorde.map((naam) => (
            <Chip key={naam} naam={naam} actief={actief === naam} onDelete={onDelete} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function Chip({
  naam,
  actief,
  onDelete,
}: {
  naam: string;
  actief: boolean;
  onDelete: (naam: string) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: naam });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/bestanden?categorie=${encodeURIComponent(naam)}`)}
      className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors active:cursor-grabbing ${
        actief
          ? "border-navy bg-navy/5 font-medium text-navy"
          : "border-navy/20 text-navy/70 hover:bg-navy/5"
      }`}
    >
      <span>{naam}</span>
      <button
        type="button"
        aria-label={`Categorie ${naam} verwijderen`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(naam);
        }}
        className="text-navy/30 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}

function FilterLink({ actief, label, href }: { actief: boolean; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        actief
          ? "border-navy bg-navy/5 font-medium text-navy"
          : "border-navy/20 text-navy/70 hover:bg-navy/5"
      }`}
    >
      {label}
    </Link>
  );
}
