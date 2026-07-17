import Link from "next/link";
import { BarChart3, Bell, Link2, type LucideIcon } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";

type Tegel = { label: string; omschrijving: string; href: string; icoon: LucideIcon; vlak: string };

const TEGELS: Tegel[] = [
  {
    label: "Notificaties",
    omschrijving: "Meldingen en updates op één plek.",
    href: "/notificaties",
    icoon: Bell,
    vlak: "bg-amber-100 text-amber-700",
  },
  {
    label: "Koppelingen",
    omschrijving: "Status van Gmail, Drive en overige diensten.",
    href: "/koppelingen",
    icoon: Link2,
    vlak: "bg-purple-100 text-purple-700",
  },
  {
    label: "Rapportage",
    omschrijving: "Maandcijfers en exports voor de boekhouding.",
    href: "/rapportage",
    icoon: BarChart3,
    vlak: "bg-blue-100 text-blue-700",
  },
];

export default function OverigPagina() {
  return (
    <>
      <PaginaKop titel="Overig" omschrijving="Notificaties, koppelingen en rapportage — gebundeld." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEGELS.map((t) => {
          const Icoon = t.icoon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4 shadow-sm transition-colors hover:border-navy/30"
            >
              <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${t.vlak}`}>
                <Icoon size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-navy">{t.label}</h2>
                <p className="mt-0.5 text-xs text-navy/60">{t.omschrijving}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
