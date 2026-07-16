"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/kleuren";

/**
 * Voortgangsdonut met een percentage in het midden (bv. maanddoel). `waarde`
 * is 0–100. De rest van de ring is een lichte navy-tint.
 */
export function Donut({
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
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="v"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={kleur} />
            <Cell fill="rgba(25,68,91,0.10)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-navy">{pct}%</span>
        {label && <span className="mt-0.5 text-xs text-navy/50">{label}</span>}
      </div>
    </div>
  );
}
