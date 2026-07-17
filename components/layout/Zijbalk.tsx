"use client";

import { WidgetLauncher } from "@/components/WidgetLauncher";
import { InfoWidgets } from "@/components/InfoWidgets";

type Info = { openTaken: number; leads: number; openstaand: number; offertes: number; klanten: number };

/**
 * Navigatie-inhoud (donkerblauw). Twee varianten:
 *  - "desktop": grotere widget-tegels (icoon + tekst eronder), 2 kolommen.
 *  - "mobiel": hamburgermenu — logo linksboven, daaronder de info-balk
 *    (dezelfde als op het startscherm) en daaronder de tegels; alles passend
 *    zonder te scrollen.
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
  if (variant === "desktop") {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-navy px-3 py-6">
        <WidgetLauncher variant="donker" kolommen={2} />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-navy px-4 pb-4 pt-6">
      <WidgetLauncher
        variant="donker"
        kolommen={4}
        compact
        bovenGrid={info ? <InfoWidgets {...info} compact donker /> : undefined}
        onNavigate={onNavigate}
      />
    </div>
  );
}
