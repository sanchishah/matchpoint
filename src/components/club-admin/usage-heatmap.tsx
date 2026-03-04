"use client";

import { Card } from "@/components/ui/card";

interface HeatmapCell {
  day: number;
  hour: number;
  fillRate: number;
  count: number;
}

interface UsageHeatmapProps {
  data: HeatmapCell[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = ["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];
const HOURS = [6, 8, 10, 12, 14, 16, 18, 20];

function getHeatColor(fillRate: number): string {
  if (fillRate === 0) return "bg-gray-100";
  if (fillRate < 25) return "bg-[#E8F4F8]";
  if (fillRate < 50) return "bg-[#B3DCE8]";
  if (fillRate < 75) return "bg-[#5BA3BC]";
  return "bg-[#0B4F6C]";
}

function getTextColor(fillRate: number): string {
  if (fillRate >= 75) return "text-white";
  return "text-[#333333]";
}

export function UsageHeatmap({ data }: UsageHeatmapProps) {
  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of data) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell);
  }

  return (
    <Card className="border-[#E2E8F0] rounded-xl p-6">
      <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-4">
        Usage Heatmap
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="grid grid-cols-[60px_repeat(8,1fr)] gap-1 mb-1">
            <div />
            {HOUR_LABELS.map((label) => (
              <div
                key={label}
                className="text-xs text-[#64748B] text-center py-1"
              >
                {label}
              </div>
            ))}
          </div>
          {/* Data rows */}
          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div
              key={dayLabel}
              className="grid grid-cols-[60px_repeat(8,1fr)] gap-1 mb-1"
            >
              <div className="text-xs text-[#64748B] flex items-center">
                {dayLabel}
              </div>
              {HOURS.map((hour) => {
                const cell = cellMap.get(`${dayIndex}-${hour}`);
                const fillRate = cell?.fillRate ?? 0;
                return (
                  <div
                    key={hour}
                    className={`rounded-md h-9 flex items-center justify-center text-xs font-medium ${getHeatColor(fillRate)} ${getTextColor(fillRate)} transition-colors`}
                    title={`${dayLabel} ${hour}:00 — ${fillRate}% fill (${cell?.count ?? 0} sessions)`}
                  >
                    {cell && cell.count > 0 ? `${fillRate}%` : ""}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-[#64748B]">
            <span>Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-4 rounded bg-gray-100" />
              <div className="w-6 h-4 rounded bg-[#E8F4F8]" />
              <div className="w-6 h-4 rounded bg-[#B3DCE8]" />
              <div className="w-6 h-4 rounded bg-[#5BA3BC]" />
              <div className="w-6 h-4 rounded bg-[#0B4F6C]" />
            </div>
            <span>High</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
