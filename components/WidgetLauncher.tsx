import Link from "next/link";
import { type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { navSecties } from "@/lib/navigatie";

/**
 * iPhone-stijl widget-rooster. Wordt op meerdere plekken gebruikt:
 *  - startscherm (/) — kleine tegels, met info-balk erboven, zonder kop.
 *  - hamburgermenu (mobiel) — logo linksboven, daaronder de info-balk en de
 *    tegels; compact zodat alles zonder scrollen past.
 *  - desktop-zijbalk — grotere tegels (icoon + tekst eronder), 2 kolommen.
 */

// Vaste kleur per sectie, zodat kleuren betekenis houden.
const KLEUR: Record<string, string> = {
  "/dashboard": "bg-purple-500",
  "/taken": "bg-teal-600",
  "/agenda": "bg-blue-500",
  "/mail": "bg-sky-500",
  "/klanten": "bg-violet-500",
  "/leads": "bg-emerald-500",
  "/bellen": "bg-green-600",
  "/audits": "bg-rose-500",
  "/offertes": "bg-cyan-600",
  "/facturen": "bg-indigo-500",
  "/sjablonen": "bg-red-500",
  "/projecten": "bg-orange-500",
  "/notulen": "bg-lime-600",
  "/whiteboard": "bg-fuchsia-500",
  "/portfolio": "bg-amber-500",
  "/bestanden": "bg-amber-600",
  "/overig": "bg-navy",
};

export function WidgetLauncher({
  variant = "licht",
  kolommen = 5,
  metKop = true,
  gecentreerd = false,
  compact = false,
  roosterAlleenMobiel = false,
  bovenGrid,
  onNavigate,
}: {
  variant?: "licht" | "donker";
  kolommen?: 2 | 4 | 5;
  metKop?: boolean;
  gecentreerd?: boolean;
  /** Compacter (kleinere marges, tegels en labels) — voor het hamburgermenu. */
  compact?: boolean;
  /** Verberg het tegelrooster vanaf md (desktop toont de zijbalk al). */
  roosterAlleenMobiel?: boolean;
  bovenGrid?: ReactNode;
  onNavigate?: () => void;
}) {
  const items = navSecties.flatMap((s) => s.items);
  const donker = variant === "donker";
  const merk = donker ? "text-white" : "text-navy";
  const merkSub = donker ? "text-white/70" : "text-navy/50";
  const label = donker ? "text-white/85" : "text-navy/80";
  const groot = kolommen === 2;
  const kolomKlasse =
    kolommen === 2 ? "grid-cols-2" : kolommen === 4 ? "grid-cols-4" : "grid-cols-5";
  const labelKlasse = groot ? "text-xs" : compact ? "text-[10px]" : "text-[11px]";

  const inhoud = (
    <div className="w-full">
      {metKop && (
        <div
          className={`flex items-center gap-3 px-1 ${compact ? "mb-3" : "mb-4"} ${
            gecentreerd ? "justify-center" : ""
          }`}
        >
          <Logo size={groot ? 52 : compact ? 40 : 44} variant={donker ? "navytegel" : "navy"} />
          <div className="leading-tight">
            <div className={`font-merk text-base font-semibold tracking-tight ${merk}`}>
              Viesa Automations
            </div>
            <div className={`text-xs font-medium ${merkSub}`}>Dashboard</div>
          </div>
        </div>
      )}

      {bovenGrid && <div className={compact ? "mb-3" : "mb-5"}>{bovenGrid}</div>}

      <div
        className={`grid gap-x-3 ${compact ? "gap-y-2.5" : "gap-y-4"} ${kolomKlasse} ${
          roosterAlleenMobiel ? "md:hidden" : ""
        }`}
      >
        {items.map((item) => {
          const Icoon = item.icoon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex flex-col items-center ${compact ? "gap-0.5" : "gap-1"}`}
            >
              <span
                className={`flex aspect-square w-full items-center justify-center rounded-[24%] text-white shadow-sm transition-transform group-active:scale-90 ${
                  KLEUR[item.href] ?? "bg-navy"
                }`}
              >
                <Icoon className="h-[46%] w-[46%]" strokeWidth={1.5} />
              </span>
              <span className={`line-clamp-1 w-full text-center font-medium ${labelKlasse} ${label}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (gecentreerd) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
        {inhoud}
      </div>
    );
  }
  return inhoud;
}
