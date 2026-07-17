import Link from "next/link";
import { BarChart3, Bell, DatabaseBackup, Download, Link2, type LucideIcon } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";

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

      {/* Back-up van de volledige database */}
      <Kaart className="mt-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <DatabaseBackup size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-navy">Database back-up</h2>
            <p className="mt-0.5 text-xs text-navy/60">
              Download het volledige schema (alle SQL-migraties) én alle data van Supabase als één
              zip-bestand. Doe dit af en toe handmatig als veilige kopie.
            </p>
            <a
              href="/api/backup"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
            >
              <Download size={16} /> Download back-up (.zip)
            </a>
          </div>
        </div>
      </Kaart>
    </>
  );
}
