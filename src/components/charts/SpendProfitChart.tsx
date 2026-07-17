"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export function SpendProfitChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#24242f" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#6c6c82", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6c6c82", fontSize: 11 }} axisLine={false} tickLine={false} width={48}
          tickFormatter={(v) => formatCurrency(Number(v), { compact: true })} />
        <Tooltip
          contentStyle={{
            background: "#14141f",
            border: "1px solid #24242f",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#a6a6bd" }}
          formatter={(value, name) => [formatCurrency(Number(value)), name === "spend" ? "Spend" : "Profit"]}
          cursor={{ fill: "rgba(124,92,255,0.08)" }}
        />
        <Bar dataKey="spend" fill="url(#spendBar)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#0b0b12", stroke: "#22c55e", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
