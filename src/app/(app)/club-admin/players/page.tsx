import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getClubForAdmin,
  getPlayerInsights,
  getEngagementMetrics,
} from "@/lib/club-analytics";
import { KPICard } from "@/components/club-admin/kpi-card";
import { SkillDistribution } from "@/components/club-admin/skill-distribution";
import { UserPlus, RefreshCw, Activity, UserX } from "lucide-react";

export default async function PlayersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const club = await getClubForAdmin(session.user.id);
  if (!club) redirect("/dashboard");

  const [playerInsights, engagement] = await Promise.all([
    getPlayerInsights(club.id),
    getEngagementMetrics(club.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-1">
          Player Insights
        </h2>
        <p className="text-sm text-[#64748B]">
          Understand your player base and engagement patterns
        </p>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="New Players This Month"
          value={engagement.newPlayersThisMonth}
          icon={UserPlus}
          subtitle={`${engagement.newPlayersThisWeek} this week`}
        />
        <KPICard
          label="Repeat Participation Rate"
          value={`${engagement.repeatRate}%`}
          icon={RefreshCw}
        />
        <KPICard
          label="Avg Sessions per Player"
          value={engagement.avgSessionsPerPlayer}
          icon={Activity}
        />
        <KPICard
          label="No-Show Rate"
          value={`${engagement.noShowRate}%`}
          icon={UserX}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillDistribution
          title="Skill Level Distribution"
          data={playerInsights.skillDistribution}
        />
        <SkillDistribution
          title="Participation Frequency"
          data={playerInsights.frequencyBuckets}
        />
      </div>
    </div>
  );
}
