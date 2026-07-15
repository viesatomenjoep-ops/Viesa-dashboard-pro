import { euro } from "@/lib/format";

export type Staaf = { label: string; waarde: number; actief?: boolean };

/** Compacte euro-weergave voor de labels boven de staven (bv. € 12k). */
function euroKort(n: number): string {
  if (n <= 0) return "–";
  if (n >= 1000) {
    const k = n / 1000;
    return `€${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return `€${Math.round(n)}`;
}

/**
 * Staafgrafiek in de huisstijl met verloop (navy → teal), waardelabels boven
 * elke staaf en de huidige maand geaccentueerd. Puur CSS, geen library.
 * Scrolt horizontaal als er veel maanden zijn.
 */
export function StaafGrafiek({ data }: { data: Staaf[] }) {
  const max = Math.max(1, ...data.map((d) => d.waarde));
  const totaal = data.reduce((s, d) => s + d.waarde, 0);
  const gemiddeld = data.length ? totaal / data.length : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold text-navy">{euro(totaal)}</p>
          <p className="text-xs text-navy/50">totaal laatste {data.length} maanden</p>
        </div>
        <p className="text-xs text-navy/50">
          gemiddeld <span className="font-medium text-navy">{euro(gemiddeld)}</span> / maand
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex h-56 min-w-[560px] items-end gap-2">
          {data.map((d, i) => {
            const hoogte = Math.round((d.waarde / max) * 100);
            return (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <span
                  className={`text-[10px] font-medium ${
                    d.actief ? "text-oranje" : "text-navy/40"
                  }`}
                >
                  {euroKort(d.waarde)}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      d.actief
                        ? "bg-oranje"
                        : "bg-gradient-to-t from-navy/70 to-navy group-hover:from-navy group-hover:to-oranje/70"
                    }`}
                    style={{ height: `${Math.max(hoogte, d.waarde > 0 ? 4 : 0)}%` }}
                    title={euro(d.waarde)}
                  />
                </div>
                <span
                  className={`text-xs capitalize ${
                    d.actief ? "font-medium text-navy" : "text-navy/50"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
