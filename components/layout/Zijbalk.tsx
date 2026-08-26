"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WidgetLauncher } from "@/components/WidgetLauncher";
import { InfoCarousel } from "@/components/InfoCarousel";
import { Logo } from "@/components/ui/Logo";
import { navSecties } from "@/lib/navigatie";

type Info = { openTaken: number; leads: number; openstaand: number; offertes: number; klanten: number };

/**
 * Navigatie-inhoud (donkerblauw). Twee varianten:
 *  - "desktop": compacte tekst-navigatie met secties — scrollt fijn van onder
 *    naar boven en laat het command center in de volle breedte staan.
 *  - "mobiel": hamburgermenu met logo, info-balk en widget-tegels.
 */
export function Zijbalk({
  variant = "mobiel",
  info,
  onNavigate,
}: {
  variant?: "desktop" | "mobiel";
  info?: Info;
  onNavigate?: () => void;
}) {
  const pad = usePathname();

  if (variant === "desktop") {
    const actief = (href: string) =>
      pad === href || pad.startsWith(href + "/") || (href === "/dashboard" && pad === "/");
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-navy px-3 py-5">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
          <Logo size={34} variant="navytegel" />
          <span className="leading-tight">
            <span className="block font-merk text-sm font-semibold text-white">Viesa Automations</span>
            <span className="block text-[11px] font-medium text-white/60">Dashboard</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-4">
          {navSecties.map((sectie) => (
            <div key={sectie.titel}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {sectie.titel}
              </p>
              <div className="space-y-0.5">
                {sectie.items.map((item) => {
                  const Icoon = item.icoon;
                  const aan = actief(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                        aan ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icoon size={17} className="shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-navy px-4 pb-4 pt-6">
      <WidgetLauncher
        variant="donker"
        kolommen={4}
        compact
        bovenGrid={info ? <InfoCarousel {...info} /> : undefined}
        onNavigate={onNavigate}
      />
    </div>
  );
}
