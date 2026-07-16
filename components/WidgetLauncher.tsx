import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { navSecties } from "@/lib/navigatie";

/**
 * iPhone-stijl "home screen": het Viesa-logo boven een rooster van vierkante
 * widget-blokken (één per sectie). Wordt gebruikt als startscherm (/) én als
 * inhoud van het hamburgermenu (zijbalk). Eén tik opent een sectie.
 */

const KLEUREN = [
  "bg-navy",
  "bg-oranje",
  "bg-blue-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-teal-600",
];

export function WidgetLauncher({
  variant = "licht",
  smal = false,
  onNavigate,
}: {
  variant?: "licht" | "donker";
  smal?: boolean;
  onNavigate?: () => void;
}) {
  const items = navSecties.flatMap((s) => s.items);
  const donker = variant === "donker";
  const merk = donker ? "text-white" : "text-navy";
  const merkSub = donker ? "text-white/70" : "text-navy/50";
  const label = donker ? "text-white/85" : "text-navy/80";
  const grid = smal
    ? "grid grid-cols-3 gap-x-2 gap-y-3"
    : "grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6 lg:grid-cols-8";

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 px-1">
        <Logo size={smal ? 36 : 44} variant={donker ? "wit" : "navy"} />
        <div className="leading-tight">
          <div className={`font-merk text-base font-semibold tracking-tight ${merk}`}>
            Viesa Automations
          </div>
          <div className={`text-xs font-medium ${merkSub}`}>Dashboard</div>
        </div>
      </div>

      <div className={grid}>
        {items.map((item, i) => {
          const Icoon = item.icoon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex aspect-square w-full items-center justify-center rounded-[22%] text-white shadow-sm transition-transform group-active:scale-95 ${
                  KLEUREN[i % KLEUREN.length]
                }`}
              >
                <Icoon size={smal ? 22 : 26} strokeWidth={1.75} />
              </span>
              <span className={`line-clamp-1 w-full text-center text-[11px] font-medium ${label}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
