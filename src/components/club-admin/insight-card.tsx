import { Card } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, TrendingUp, Info } from "lucide-react";

interface InsightCardProps {
  type: "success" | "warning" | "info" | "growth";
  message: string;
}

const config = {
  success: {
    icon: Lightbulb,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-600",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
  },
  growth: {
    icon: TrendingUp,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-600",
  },
};

export function InsightCard({ type, message }: InsightCardProps) {
  const { icon: Icon, bg, border, iconColor } = config[type];

  return (
    <Card className={`${bg} ${border} rounded-xl p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-[#333333]">{message}</p>
    </Card>
  );
}
