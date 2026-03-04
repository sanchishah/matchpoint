import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number; // percentage change
    label?: string;
  };
  subtitle?: string;
}

export function KPICard({ label, value, icon: Icon, trend, subtitle }: KPICardProps) {
  const TrendIcon =
    trend && trend.value > 0
      ? TrendingUp
      : trend && trend.value < 0
        ? TrendingDown
        : Minus;

  const trendColor =
    trend && trend.value > 0
      ? "text-emerald-600"
      : trend && trend.value < 0
        ? "text-red-500"
        : "text-[#64748B]";

  return (
    <Card className="border-[#E2E8F0] rounded-xl p-6">
      <div className="w-10 h-10 rounded-xl bg-[#E8F4F8] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#0B4F6C]" />
      </div>
      <p className="text-2xl font-light text-[#0A0A0A]">{value}</p>
      <p className="text-xs text-[#64748B] mt-1">{label}</p>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>
            {trend.value > 0 ? "+" : ""}
            {trend.value}%{trend.label ? ` ${trend.label}` : ""}
          </span>
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-[#64748B] mt-2">{subtitle}</p>
      )}
    </Card>
  );
}
