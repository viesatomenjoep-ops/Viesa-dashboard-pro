import Link from "next/link";
import { FileText, ListTodo, Receipt, Users } from "lucide-react";
import { euro } from "@/lib/format";

/**
 * iPhone-stijl info-balk onder het logo: brede kaarten met een cijfer in één
 * oogopslag (te doen, leads, openstaand, offertes). Horizontaal scrollbaar —
 * de pagina zelf scrollt niet.
 */
export function InfoWidgets({
  openTaken,
  leads,
  openstaand,
  offertes,
}: {
  openTaken: number;
  leads: number;
  openstaand: number;
  offertes: number;
}) {
  const kaarten = [
    { label: "Te doen", waarde: String(openTaken), icoon: ListTodo, kleur: "bg-blue-500", href: "/taken" },
    { label: "Leads", waarde: String(leads), icoon: Users, kleur: "bg-emerald-500", href: "/leads" },
    { label: "Openstaand", waarde: euro(openstaand), icoon: Receipt, kleur: "bg-amber-500", href: "/facturen" },
    { label: "Offertes", waarde: String(offertes), icoon: FileText, kleur: "bg-purple-500", href: "/offertes" },
  ];

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
