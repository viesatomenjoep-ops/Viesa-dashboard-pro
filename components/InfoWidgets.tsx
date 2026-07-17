import Link from "next/link";
import { Building2, FileText, ListTodo, ReceiptEuro, Users } from "lucide-react";
import { euro } from "@/lib/format";

/**
 * Info-balk met snelkoppelingen. In "compact"-modus (hamburgermenu) zijn de
 * tegels net zo groot als de widget-iconen eronder: een gekleurd vierkant met
 * icoon + cijfer en een label eronder. Elke tegel linkt direct naar de pagina.
 */
export function InfoWidgets({
  openTaken,
  leads,
  openstaand,
  offertes,
  klanten = 0,
  compact = false,
  donker = false,
}: {
  openTaken: number;
  leads: number;
  openstaand: number;
  offertes: number;
  klanten?: number;
  compact?: boolean;
  donker?: boolean;
}) {
  const kaarten = [
    { label: "Te doen", waarde: String(openTaken), icoon: ListTodo, kleur: "bg-blue-500", href: "/taken" },
    { label: "Leads", waarde: String(leads), icoon: Users, kleur: "bg-emerald-500", href: "/leads" },
    { label: "Openstaand", waarde: euro(openstaand), icoon: ReceiptEuro, kleur: "bg-amber-500", href: "/facturen" },
    { label: "Offertes", waarde: String(offertes), icoon: FileText, kleur: "bg-purple-500", href: "/offertes" },
    { label: "Klanten", waarde: String(klanten), icoon: Building2, kleur: "bg-violet-500", href: "/klanten" },
  ];

  if (compact) {
    const label = donker ? "text-white/85" : "text-navy/70";
    return (
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {kaarten.map((k) => {
          const Icoon = k.icoon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-1"
            >
              <span
                className={`flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-[24%] text-white shadow-sm transition-transform group-active:scale-90 ${k.kleur}`}
              >
                <Icoon className="h-[28%] w-[28%]" strokeWidth={1.5} />
                <span className="max-w-full truncate px-1 text-base font-bold leading-none">{k.waarde}</span>
              </span>
              <span className={`line-clamp-1 w-full text-center text-[10px] font-medium ${label}`}>
                {k.label}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {kaarten.map((k) => {
        const Icoon = k.icoon;
        return (
          <Link
            key={k.label}
            href={k.href}
            className="flex h-28 w-40 shrink-0 flex-col justify-between rounded-2xl border border-navy/10 bg-white p-3 shadow-sm transition-transform active:scale-95"
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-white ${k.kleur}`}>
              <Icoon size={18} />
            </span>
            <div>
              <div className="text-2xl font-semibold leading-tight text-navy">{k.waarde}</div>
              <div className="text-xs text-navy/50">{k.label}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
