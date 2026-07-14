import { euro } from "@/lib/format";

export type Staaf = { label: string; waarde: number; actief?: boolean };

/**
 * Eenvoudige staafgrafiek (huisstijl): navy staven, de actieve maand oranje.
 * Puur CSS, geen externe library.
 */
export function StaafGrafiek({ data }: { data: Staaf[] }) {
  const max = Math.max(1, ...data.map((d) => d.waarde));

  return (
    <div className="flex h-52 items-end gap-3">
      {data.map((d, i) => {
        const hoogte = Math.round((d.waarde / max) * 100);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-md ${
                  d.actief ? "bg-oranje" : "bg-navy/80"
                }`}
                style={{ height: `${Math.max(hoogte, d.waarde > 0 ? 4 : 0)}%` }}
                title={euro(d.waarde)}
              />
            </div>
            <span className="text-xs text-navy/50">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
