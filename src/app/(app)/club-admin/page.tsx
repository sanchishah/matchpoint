import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getClubForAdmin,
  getClubKPIs,
  getFillRateTrend,
  getUsageHeatmap,
  getActionableInsights,
} from "@/lib/club-analytics";
import { KPICard } from "@/components/club-admin/kpi-card";
import { FillRateChart } from "@/components/club-admin/fill-rate-chart";
import { UsageHeatmap } from "@/components/club-admin/usage-heatmap";
import { InsightCard } from "@/components/club-admin/insight-card";
import {
  Users,
  UserCheck,
  Calendar,
  Percent,
  RefreshCw,
  Clock,
} from "lucide-react";

export default async function ClubAdminDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const club = await getClubForAdmin(session.user.id);
  if (!club) redirect("/dashboard");

  const [kpis, fillRateTrend, heatmapData, insights] = await Promise.all([
    getClubKPIs(club.id),
    getFillRateTrend(club.id, 12),
    getUsageHeatmap(club.id),
    getActionableInsights(club.id),
  ]);

  const weekDiff =
    kpis.sessionsLastWeek > 0
      ? Math.round(
          ((kpis.sessionsThisWeek - kpis.sessionsLastWeek) /
            kpis.sessionsLastWeek) *
            100
        )
      : 0;

  const fillDiff = kpis.averageFillRate - kpis.previousFillRate;

  return (
    <div className="space-y-8">
      {/* Quick Insights Banner */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.slice(0, 3).map((insight, i) => (
            <InsightCard key={i} type={insight.type} message={insight.message} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Total Registered Players"
          value={kpis.totalRegisteredPlayers}
          icon={Users}
        />
        <KPICard
          label="Active Players (30d)"
          value={kpis.activePlayers30d}
          icon={UserCheck}
          subtitle={
            kpis.totalPlayers > 0
              ? `${Math.round((kpis.activePlayers30d / kpis.totalPlayers) * 100)}% of total`
              : undefined
          }
        />
        <KPICard
          label="Sessions This Week"
          value={kpis.sessionsThisWeek}
          icon={Calendar}
          trend={
            kpis.sessionsLastWeek > 0
              ? { value: weekDiff, label: "vs last week" }
              : undefined
          }
        />
        <KPICard
          label="Average Fill Rate"
          value={`${kpis.averageFillRate}%`}
          icon={Percent}
          trend={
            kpis.previousFillRate > 0
              ? { value: fillDiff, label: "vs prior period" }
              : undefined
          }
        />
        <KPICard
          label="Returning Player Rate"
          value={`${kpis.returningPlayerRate}%`}
          icon={RefreshCw}
        />
        <KPICard
          label="Peak Play Time"
          value={kpis.peakPlayTime}
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FillRateChart data={fillRateTrend} />
        <UsageHeatmap data={heatmapData} />
      </div>
    </div>
  );
}
