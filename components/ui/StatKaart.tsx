import Link from "next/link";
import { type ComponentType } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CHART } from "@/lib/kleuren";
import { Sparkline } from "./Sparkline";

type Toon = "teal" | "groen" | "amber" | "blauw" | "paars" | "rood" | "grijs";

const vlakken: Record<Toon, string> = {
  teal: "bg-oranje/10 text-oranje",
  groen: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blauw: "bg-blue-100 text-blue-700",
  paars: "bg-purple-100 text-purple-700",
  rood: "bg-red-100 text-red-700",
  grijs: "bg-navy/5 text-navy/50",
};

const sparkKleur: Record<Toon, string> = {
  teal: CHART.teal,
  groen: CHART.groen,
  amber: CHART.amber,
  blauw: CHART.blauw,
  paars: CHART.paars,
  rood: CHART.rood,
  grijs: CHART.navy,
};

/**
 * KPI-kaart in de Haze-stijl: label, groot cijfer, optioneel een Lucide-icoon
 * in een gekleurd vlak, een trend-pil (+% groen / −% rood) en een sparkline.
 * Backwards-compatibel naast de bestaande `KpiKaart`.
 */
export function StatKaart({
  label,
  waarde,
  subtekst,
  icoon: Icoon,
  toon = "teal",
  trend,
  sparkline,
  href,
}: {
  label: string;
  waarde: string;
  subtekst?: string;
  icoon?: ComponentType<{ className?: string; size?: number | string }>;
  toon?: Toon;
  trend?: { waarde: string; positief?: boolean };
  sparkline?: number[];
  href?: string;
}) {
  const inhoud = (
    <div className="flex h-full flex-col rounded-xl border border-navy/10 bg-white p-5 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-navy/60">{label}</span>
        {Icoon && (
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${vlakken[toon]}`}
          >
            <Icoon size={18} />
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-navy">{waarde}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend.positief === false ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {trend.positief === false ? (
              <TrendingDown size={13} />
            ) : (
              <TrendingUp size={13} />
            )}
            {trend.waarde}
          </span>
        )}
      </div>
      {subtekst && <p className="mt-1 text-xs text-navy/50">{subtekst}</p>}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3">
          <Sparkline data={sparkline} kleur={sparkKleur[toon]} hoogte={40} />
        </div>
      )}
    </div>
  );

  if (!href) return inhoud;
  return (
    <Link href={href} className="block h-full [&>div]:hover:border-navy/30">
      {inhoud}
    </Link>
  );
}
