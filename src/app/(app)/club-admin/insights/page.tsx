import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getClubForAdmin,
  getValueIndicators,
  getMonthlyGrowth,
  getActionableInsights,
} from "@/lib/club-analytics";
import { KPICard } from "@/components/club-admin/kpi-card";
import { GrowthChart } from "@/components/club-admin/growth-charts";
import { InsightCard } from "@/components/club-admin/insight-card";
import {
  CheckCircle,
  Percent,
  TrendingUp,
  BarChart3,
  DollarSign,
} from "lucide-react";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const club = await getClubForAdmin(session.user.id);
  if (!club) redirect("/dashboard");

  const [indicators, growth, insights] = await Promise.all([
    getValueIndicators(club.id),
    getMonthlyGrowth(club.id, 6),
    getActionableInsights(club.id),
  ]);

  const fillRateChange = indicators.fillRateThisMonth - indicators.fillRateLastMonth;
  const playerGrowthChange =
    indicators.playerGrowthLastMonth > 0
      ? Math.round(
          ((indicators.playerGrowthThisMonth -
            indicators.playerGrowthLastMonth) /
            indicators.playerGrowthLastMonth) *
            100
        )
      : 0;
  const utilizationChange =
    indicators.courtUtilizationThisMonth - indicators.courtUtilizationLastMonth;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-1">
          Value & Insights
        </h2>
        <p className="text-sm text-[#64748B]">
          See the impact MatchPoint has on your business
        </p>
      </div>

      {/* Value Indicator Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Sessions Filled via MatchPoint"
          value={indicators.totalSessionsFilled}
          icon={CheckCircle}
        />
        <KPICard
          label="Fill Rate This Month"
          value={`${indicators.fillRateThisMonth}%`}
          icon={Percent}
          trend={
            indicators.fillRateLastMonth > 0
              ? { value: fillRateChange, label: "vs last month" }
              : undefined
          }
        />
        <KPICard
          label="Player Growth This Month"
          value={indicators.playerGrowthThisMonth}
          icon={TrendingUp}
          trend={
            indicators.playerGrowthLastMonth > 0
              ? { value: playerGrowthChange, label: "vs last month" }
              : undefined
          }
        />
        <KPICard
          label="Court Utilization"
          value={`${indicators.courtUtilizationThisMonth}%`}
          icon={BarChart3}
          trend={
            indicators.courtUtilizationLastMonth > 0
              ? { value: utilizationChange, label: "vs last month" }
              : undefined
          }
        />
        <KPICard
          label="Revenue Facilitated"
          value={`$${indicators.revenueFacilitated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GrowthChart
          title="Participation Growth"
          data={growth.participationGrowth}
          type="area"
          valueLabel="Unique Players"
          color="#0B4F6C"
        />
        <GrowthChart
          title="Fill Rate Over Time"
          data={growth.fillRateGrowth}
          type="line"
          valueLabel="Fill Rate"
          valueSuffix="%"
          color="#0B4F6C"
        />
        <GrowthChart
          title="Session Volume"
          data={growth.sessionVolume}
          type="bar"
          valueLabel="Sessions"
          color="#0B4F6C"
        />
      </div>

      {/* Actionable Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-4">
            Actionable Recommendations
          </h3>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard
                key={i}
                type={insight.type}
                message={insight.message}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
