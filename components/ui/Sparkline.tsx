"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/kleuren";

/** Kleine trendlijn zonder assen — voor in KPI-kaarten (StatKaart). */
export function Sparkline({
  data,
  kleur = CHART.teal,
  hoogte = 40,
}: {
  data: number[];
  kleur?: string;
  hoogte?: number;
}) {
  const id = useId().replace(/:/g, "");
  const punten = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={hoogte}>
      <AreaChart data={punten} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={kleur} stopOpacity={0.25} />
            <stop offset="100%" stopColor={kleur} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={kleur}
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
