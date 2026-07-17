"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { RetailerSlice } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#7c5cff", "#3b82f6", "#22d3ee", "#c026d3", "#22c55e", "#f5a524", "#e948d6", "#6366f1"];

export function RetailerDonut({ data }: { data: RetailerSlice[] }) {
  const top = data.slice(0, 8);
  const total = top.reduce((a, s) => a + s.spend, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="max-w-[220px]">
        <PieChart>
          <Pie
            data={top}
            dataKey="spend"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
          >
            {top.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#14141f", border: "1px solid #24242f", borderRadius: 12, fontSize: 12 }}
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="w-full flex-1 space-y-1.5">
        {top.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 text-fg-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              {s.name}
            </span>
            <span className="tabular text-fg">
              {formatCurrency(s.spend)}
              <span className="ml-1.5 text-fg-faint">
                {total > 0 ? Math.round((s.spend / total) * 100) : 0}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
