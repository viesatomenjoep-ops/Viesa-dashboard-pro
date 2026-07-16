"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/kleuren";

export type AreaPunt = { label: string; waarde: number };

/**
 * Vloeiende area-grafiek (bv. omzet per maand), in teal. Toont assen, een
 * rustig raster en een tooltip. `formaat` bepaalt de getalnotatie — een string
 * i.p.v. een functie, omdat een server-component geen functie aan deze
 * client-component mag doorgeven.
 */
export function AreaGrafiek({
  data,
  kleur = CHART.teal,
  hoogte = 260,
  formaat = "getal",
}: {
  data: AreaPunt[];
  kleur?: string;
  hoogte?: number;
  formaat?: "euro" | "getal";
}) {
  const id = useId().replace(/:/g, "");
  const formatWaarde = (n: number) =>
    formaat === "euro"
      ? n >= 1000
        ? `€${Math.round(n / 1000)}k`
        : `€${Math.round(n)}`
      : new Intl.NumberFormat("nl-NL").format(n);
  return (
    <ResponsiveContainer width="100%" height={hoogte}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={kleur} stopOpacity={0.22} />
            <stop offset="100%" stopColor={kleur} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#19445B" strokeOpacity={0.08} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#19445B", fillOpacity: 0.5 }}
          minTickGap={16}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#19445B", fillOpacity: 0.5 }}
          tickFormatter={formatWaarde}
        />
        <Tooltip
          formatter={(v) => [formatWaarde(Number(v)), "Waarde"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(25,68,91,0.12)",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(25,68,91,0.10)",
          }}
          labelStyle={{ color: "#19445B", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="waarde"
          stroke={kleur}
          strokeWidth={2.5}
          fill={`url(#area-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
