"use client";

import { useState } from "react";
import { LANDEN, REGIOS_PER_LAND } from "@/lib/klanten";

/**
 * Gekoppelde land- en regio-keuze: kies eerst een land, dan tonen de regio's
 * (provincies/deelstaten) van dát land. Rendert twee <select>'s met de namen
 * `land` en `regio` zodat het gewoon in een formulier meegepost wordt.
 */
export function LandRegio({
  land = "Nederland",
  regio = "",
  className = "",
  toonLabels = false,
}: {
  land?: string;
  regio?: string;
  className?: string;
  toonLabels?: boolean;
}) {
  const [gekozenLand, setGekozenLand] = useState(land || "Nederland");
  const regios = REGIOS_PER_LAND[gekozenLand] ?? [];

  return (
    <>
      <div>
        {toonLabels && <label className="mb-1 block text-sm font-medium text-navy">Land</label>}
        <select
          name="land"
          value={gekozenLand}
          onChange={(e) => setGekozenLand(e.target.value)}
          className={className}
        >
          {LANDEN.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        {toonLabels && <label className="mb-1 block text-sm font-medium text-navy">Regio</label>}
        {/* key op het land: bij wisselen van land reset de regiokeuze netjes. */}
        <select name="regio" defaultValue={regio} key={gekozenLand} className={className}>
          <option value="">Regio…</option>
          {regios.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </>
  );
}
