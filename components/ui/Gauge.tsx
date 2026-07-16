"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/kleuren";

/**
 * Halve-cirkel meter (bv. win-rate) met een waarde in het midden. `waarde` is
 * 0–100. Voor CRM-/analytics-kaarten in latere fases.
 */
export function Gauge({
  waarde,
  label,
  kleur = CHART.teal,
  size = 160,
}: {
  waarde: number;
  label?: string;
  kleur?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(waarde)));
  const data = [
    { naam: "bereikt", v: pct },
    { naam: "rest", v: 100 - pct },
  ];
  return (
    <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="v"
            cx="50%"
            cy="100%"
            innerRadius="130%"
            outerRadius="180%"
            startAngle={180}
            endAngle={0}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={kleur} />
            <Cell fill="rgba(25,68,91,0.10)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-2xl font-semibold text-navy">{pct}%</span>
        {label && <span className="text-xs text-navy/50">{label}</span>}
      </div>
    </div>
  );
}
