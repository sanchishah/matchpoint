"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface FillRateChartProps {
  data: { week: string; fillRate: number }[];
}

export function FillRateChart({ data }: FillRateChartProps) {
  return (
    <Card className="border-[#E2E8F0] rounded-xl p-6">
      <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-4">
        Fill Rate Trend
      </h3>
      <div className="h-[280px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`, "Fill Rate"]}
              />
              <Line
                type="monotone"
                dataKey="fillRate"
                stroke="#0B4F6C"
                strokeWidth={2}
                dot={{ fill: "#0B4F6C", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[#64748B]">
            No data available yet
          </div>
        )}
      </div>
    </Card>
  );
}
