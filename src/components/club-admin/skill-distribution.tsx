"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface SkillDistributionProps {
  data: { label: string; count: number }[];
  title: string;
}

export function SkillDistribution({ data, title }: SkillDistributionProps) {
  return (
    <Card className="border-[#E2E8F0] rounded-xl p-6">
      <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-4">
        {title}
      </h3>
      <div className="h-[280px]">
        {data.some((d) => d.count > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number | undefined) => [value ?? 0, "Players"]}
              />
              <Bar
                dataKey="count"
                fill="#0B4F6C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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
