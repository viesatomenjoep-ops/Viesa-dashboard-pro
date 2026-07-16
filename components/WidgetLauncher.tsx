import Link from "next/link";
import { type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { navSecties } from "@/lib/navigatie";

/**
 * iPhone-stijl "home screen": het Viesa-logo boven een rooster van vierkante
 * widget-blokken (één per sectie). Compact opgezet zodat alles in één oogopslag
 * past. Wordt gebruikt als startscherm (/) én als hamburgermenu (zijbalk).
 */

// Vaste kleur per sectie (i.p.v. cyclisch), zodat kleuren betekenis houden.
const KLEUR: Record<string, string> = {
  "/dashboard": "bg-purple-500",
  "/taken": "bg-teal-600",
  "/agenda": "bg-blue-500",
  "/mail": "bg-sky-500",
  "/notificaties": "bg-amber-500",
  "/klanten": "bg-violet-500",
  "/leads": "bg-emerald-500",
  "/audits": "bg-rose-500",
  "/offertes": "bg-cyan-600",
  "/facturen": "bg-indigo-500",
  "/sjablonen": "bg-red-500",
  "/rapportage": "bg-navy",
  "/projecten": "bg-orange-500",
  "/whiteboard": "bg-fuchsia-500",
  "/bestanden": "bg-amber-600",
  "/koppelingen": "bg-purple-600",
};

export function WidgetLauncher({
  variant = "licht",
  smal = false,
  gecentreerd = false,
  bovenGrid,
  onNavigate,
}: {
  variant?: "licht" | "donker";
  smal?: boolean;
  /** Startscherm: logo + widgets verticaal en horizontaal in het midden. */
  gecentreerd?: boolean;
  /** Optionele inhoud tussen de kop en het rooster (bv. de info-balk). */
  bovenGrid?: ReactNode;
  onNavigate?: () => void;
}) {
  const items = navSecties.flatMap((s) => s.items);
  const donker = variant === "donker";
  const merk = donker ? "text-white" : "text-navy";
  const merkSub = donker ? "text-white/70" : "text-navy/50";
  const label = donker ? "text-white/85" : "text-navy/80";
  const grid = smal
    ? "grid grid-cols-4 gap-x-2 gap-y-3"
    : "mx-auto grid w-full max-w-sm grid-cols-5 gap-x-3 gap-y-4";

  const inhoud = (
    <div className={gecentreerd ? "w-full" : ""}>
      <div
        className={`mb-5 flex items-center gap-3 px-1 ${
          gecentreerd ? "justify-center" : ""
        }`}
      >
        <Logo size={smal ? 32 : 38} variant={donker ? "wit" : "navy"} />
        <div className="leading-tight">
          <div className={`font-merk text-base font-semibold tracking-tight ${merk}`}>
            Viesa Automations
          </div>
          <div className={`text-xs font-medium ${merkSub}`}>Dashboard</div>
        </div>
      </div>

      {bovenGrid && <div className="mb-5">{bovenGrid}</div>}

      <div className={grid}>
        {items.map((item) => {
          const Icoon = item.icoon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`flex aspect-square w-full items-center justify-center rounded-[24%] text-white shadow-sm transition-transform group-active:scale-90 ${
                  KLEUR[item.href] ?? "bg-navy"
                }`}
              >
                {/* Subtiel, iets kleiner icoon dat meeschaalt met de tegel. */}
                <Icoon className="h-[46%] w-[46%]" strokeWidth={1.5} />
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

  // Startscherm: alles verticaal in het midden van het scherm.
  if (gecentreerd) {
    return (
      <div className="flex min-h-[calc(100vh_-_9rem)] flex-col items-center justify-center">
        {inhoud}
      </div>
    );
  }
  return inhoud;
}
