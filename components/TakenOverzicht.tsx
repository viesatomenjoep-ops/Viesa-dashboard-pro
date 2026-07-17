"use client";

import { useState } from "react";
import { CheckCircle2, Clock, ListTodo, Loader, type LucideIcon } from "lucide-react";
import { TegelSheet } from "@/components/ui/TegelSheet";
import { TakenKolomLijst } from "@/components/TakenKolomLijst";
import {
  TAAK_STATUSSEN,
  TAAK_PERSONEN,
  persoonLabel,
  type Taak,
  type TaakStatus,
  type TaakWie,
} from "@/lib/taken";

const STATUS_STIJL: Record<TaakStatus, { icoon: LucideIcon; vlak: string }> = {
  todo: { icoon: ListTodo, vlak: "bg-blue-100 text-blue-700" },
  bezig: { icoon: Loader, vlak: "bg-amber-100 text-amber-700" },
  review: { icoon: Clock, vlak: "bg-purple-100 text-purple-700" },
  klaar: { icoon: CheckCircle2, vlak: "bg-emerald-100 text-emerald-700" },
};

/**
 * Taken-overzicht: bovenaan een sticky persoonsfilter (Iedereen/Tom/Joep/Team
 * Viesa) en daaronder de vier status-tegels. Elke tegel toont de top 3 taken van
 * die kolom (voor de gekozen persoon) en opent bij klikken de volledige lijst.
 */
export function TakenOverzicht({
  taken,
  bewerkActie,
  verwijderActie,
}: {
  taken: Taak[];
  bewerkActie: (formData: FormData) => Promise<void>;
  verwijderActie: (id: string) => Promise<void>;
}) {
  const [persoon, setPersoon] = useState<TaakWie | "alle">("alle");
  const zichtbaar = persoon === "alle" ? taken : taken.filter((t) => t.wie === persoon);

  return (
    <>
      {/* Persoonsfilter — blijft vaststaan tot je een andere kiest */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterKnop actief={persoon === "alle"} onClick={() => setPersoon("alle")}>
          Iedereen
        </FilterKnop>
        {TAAK_PERSONEN.map((p) => (
          <FilterKnop key={p.key} actief={persoon === p.key} onClick={() => setPersoon(p.key)}>
            {p.label}
          </FilterKnop>
        ))}
      </div>

      {/* Vier status-tegels met een mini top-3 */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TAAK_STATUSSEN.map((s) => {
          const kolom = zichtbaar.filter((t) => t.status === s.key);
          return (
            <TegelSheet key={s.key} titel={s.label} tegel={<Tegel status={s.key} label={s.label} taken={kolom} />}>
              <TakenKolomLijst taken={kolom} bewerkActie={bewerkActie} verwijderActie={verwijderActie} />
            </TegelSheet>
          );
        })}
      </section>
    </>
  );
}

function FilterKnop({
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
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        actief ? "bg-navy text-white" : "border border-navy/20 text-navy hover:bg-navy/5"
      }`}
    >
      {children}
    </button>
  );
}

function Tegel({ status, label, taken }: { status: TaakStatus; label: string; taken: Taak[] }) {
  const { icoon: Icoon, vlak } = STATUS_STIJL[status];
  return (
    <div className="flex h-full flex-col rounded-xl border border-navy/10 bg-white p-4 text-left shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-navy/60">{label}</span>
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${vlak}`}>
          <Icoon size={16} />
        </span>
      </div>
      <div className="mt-1 text-2xl font-semibold text-navy">{taken.length}</div>
      <ul className="mt-2 space-y-1">
        {taken.slice(0, 3).map((t) => (
          <li key={t.id} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy/30" />
            <span className="min-w-0 flex-1 truncate text-xs text-navy/70">{t.titel}</span>
            <span className="shrink-0 text-[10px] font-medium text-navy/40">{persoonLabel(t.wie)}</span>
          </li>
        ))}
        {taken.length === 0 && <li className="text-xs text-navy/35">Niets open</li>}
        {taken.length > 3 && (
          <li className="pt-0.5 text-[11px] font-medium text-oranje">+{taken.length - 3} meer</li>
        )}
      </ul>
    </div>
  );
}
