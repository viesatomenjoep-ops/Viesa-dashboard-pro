"use client";

import { WidgetLauncher } from "@/components/WidgetLauncher";

/**
 * Inhoud van de zijbalk / het hamburgermenu (donkerblauw): het iPhone-stijl
 * widget-rooster. Eén tik opent een sectie (en sluit het mobiele menu).
 */
export function Zijbalk({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-navy px-4 py-6">
      <WidgetLauncher variant="donker" smal onNavigate={onNavigate} />
    </div>
  );
}
