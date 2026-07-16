"use client";

import { WidgetLauncher } from "@/components/WidgetLauncher";

/**
 * Navigatie-inhoud (donkerblauw). Twee varianten:
 *  - "desktop": grotere widget-tegels (icoon + tekst eronder), 2 kolommen.
 *  - "mobiel": kleinere tegels, gecentreerd, geen scroll (hamburgermenu).
 */
export function Zijbalk({
  variant = "mobiel",
  onNavigate,
}: {
  variant?: "desktop" | "mobiel";
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
    <div className="flex h-full flex-col overflow-hidden bg-navy px-4 py-6">
      <WidgetLauncher variant="donker" kolommen={4} gecentreerd onNavigate={onNavigate} />
    </div>
  );
}
