import { prisma } from "@/lib/db";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  getDay,
  getHours,
} from "date-fns";

// ─── Auth helper ────────────────────────────────────

export async function getClubForAdmin(userId: string) {
  const clubAdmin = await prisma.clubAdmin.findFirst({
    where: { userId },
    include: { club: true },
  });
  return clubAdmin?.club ?? null;
}

// ─── Types ──────────────────────────────────────────

export type DateRange = { from: Date; to: Date };

export interface KPIData {
  totalRegisteredPlayers: number;
  activePlayers30d: number;
  totalPlayers: number;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  averageFillRate: number;
  previousFillRate: number;
  returningPlayerRate: number;
  peakPlayTime: string;
}

export interface SessionRow {
  id: string;
  date: Date;
  startTime: Date;
  durationMins: number;
  format: string;
  capacity: number;
  playersJoined: number;
  waitlistCount: number;
  fillPercent: number;
  status: string;
  skillLevel: number;
}

export interface FillRatePoint {
  week: string;
  fillRate: number;
}

export interface HeatmapCell {
  day: number; // 0=Sun, 6=Sat
  hour: number;
  fillRate: number;
  count: number;
}

export interface EngagementMetrics {
  newPlayersThisWeek: number;
  newPlayersThisMonth: number;
  repeatRate: number;
  avgSessionsPerPlayer: number;
  noShowRate: number;
}

export interface SkillBucket {
  level: number;
  label: string;
  count: number;
}

export interface FrequencyBucket {
  label: string;
  count: number;
}

export interface ValueIndicators {
  totalSessionsFilled: number;
  fillRateThisMonth: number;
  fillRateLastMonth: number;
  playerGrowthThisMonth: number;
  playerGrowthLastMonth: number;
  courtUtilizationThisMonth: number;
  courtUtilizationLastMonth: number;
  revenueFacilitated: number;
}

export interface MonthlyPoint {
  month: string;
  value: number;
}

export interface ActionableInsight {
  type: "success" | "warning" | "info" | "growth";
  message: string;
}

// ─── KPI Queries ────────────────────────────────────

export async function getClubKPIs(clubId: string): Promise<KPIData> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);
  const lastWeekEnd = subWeeks(weekEnd, 1);

  const [
    totalRegisteredPlayers,
    activePlayers30d,
    sessionsThisWeek,
    sessionsLastWeek,
    recentSlots,
    previousSlots,
    playerSessionCounts,
    slotTimes,
  ] = await Promise.all([
    // Total unique players who ever joined a slot at this club
    prisma.slotParticipant.findMany({
      where: {
        slot: { clubId },
        status: { in: ["JOINED", "WAITLISTED"] },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Active players in last 30 days
    prisma.slotParticipant.findMany({
      where: {
        slot: { clubId },
        status: "JOINED",
        joinedAt: { gte: thirtyDaysAgo },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Sessions this week
    prisma.slot.count({
      where: {
        clubId,
        startTime: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
    }),
    // Sessions last week
    prisma.slot.count({
      where: {
        clubId,
        startTime: { gte: lastWeekStart, lte: lastWeekEnd },
        status: { not: "CANCELLED" },
      },
    }),
    // Recent slots with participant counts (last 30 days)
    prisma.slot.findMany({
      where: {
        clubId,
        startTime: { gte: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: {
        requiredPlayers: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    }),
    // Previous period slots (30-60 days ago)
    prisma.slot.findMany({
      where: {
        clubId,
        startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: {
        requiredPlayers: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    }),
    // Player session counts for returning rate
    prisma.slotParticipant.groupBy({
      by: ["userId"],
      where: {
        slot: { clubId },
        status: "JOINED",
      },
      _count: { _all: true },
    }),
    // All slots with times for peak calculation
    prisma.slot.findMany({
      where: {
        clubId,
        status: { not: "CANCELLED" },
        startTime: { gte: thirtyDaysAgo },
      },
      select: {
        startTime: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    }),
  ]);

  // Average fill rate (recent)
  const avgFillRate =
    recentSlots.length > 0
      ? recentSlots.reduce(
          (sum, s) => sum + s._count.participants / s.requiredPlayers,
          0
        ) / recentSlots.length
      : 0;

  // Previous fill rate
  const prevFillRate =
    previousSlots.length > 0
      ? previousSlots.reduce(
          (sum, s) => sum + s._count.participants / s.requiredPlayers,
          0
        ) / previousSlots.length
      : 0;

  // Returning player rate (2+ sessions)
  const totalUniquePlayers = playerSessionCounts.length;
  const returningPlayers = playerSessionCounts.filter(
    (p) => p._count._all >= 2
  ).length;
  const returningRate =
    totalUniquePlayers > 0 ? returningPlayers / totalUniquePlayers : 0;

  // Peak play time
  const timeSlotCounts: Record<string, number> = {};
  for (const slot of slotTimes) {
    const day = format(slot.startTime, "EEE");
    const hour = getHours(slot.startTime);
    const key = `${day} ${hour % 12 || 12}–${(hour + 2) % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
    timeSlotCounts[key] = (timeSlotCounts[key] || 0) + slot._count.participants;
  }
  const peakEntry = Object.entries(timeSlotCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  return {
    totalRegisteredPlayers: totalRegisteredPlayers.length,
    activePlayers30d: activePlayers30d.length,
    totalPlayers: totalRegisteredPlayers.length,
    sessionsThisWeek,
    sessionsLastWeek,
    averageFillRate: Math.round(avgFillRate * 100),
    previousFillRate: Math.round(prevFillRate * 100),
    returningPlayerRate: Math.round(returningRate * 100),
    peakPlayTime: peakEntry ? peakEntry[0] : "No data",
  };
}

// ─── Session Utilization ────────────────────────────

export async function getSessionUtilization(
  clubId: string,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    statusFilter?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
): Promise<{ rows: SessionRow[]; total: number }> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = "startTime",
    sortDir = "desc",
    statusFilter,
    dateFrom,
    dateTo,
  } = options;

  const where: Record<string, unknown> = { clubId };
  if (dateFrom || dateTo) {
    where.startTime = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [slots, total] = await Promise.all([
    prisma.slot.findMany({
      where,
      include: {
        participants: {
          select: { status: true },
        },
      },
      orderBy: { [sortBy === "date" ? "startTime" : sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.slot.count({ where }),
  ]);

  const rows: SessionRow[] = slots.map((slot) => {
    const joined = slot.participants.filter((p) => p.status === "JOINED").length;
    const waitlisted = slot.participants.filter(
      (p) => p.status === "WAITLISTED"
    ).length;
    const fillPercent = Math.round((joined / slot.requiredPlayers) * 100);

    let displayStatus: string;
    if (slot.status === "CANCELLED") displayStatus = "Cancelled";
    else if (fillPercent >= 100) displayStatus = "Full";
    else if (fillPercent >= 50) displayStatus = "Filling";
    else displayStatus = "Low";

    return {
      id: slot.id,
      date: slot.startTime,
      startTime: slot.startTime,
      durationMins: slot.durationMins,
      format: slot.format,
      capacity: slot.requiredPlayers,
      playersJoined: joined,
      waitlistCount: waitlisted,
      fillPercent,
      status: displayStatus,
      skillLevel: slot.skillLevel,
    };
  });

  // Apply status filter after computing fill status
  const filteredRows = statusFilter
    ? rows.filter(
        (r) => r.status.toLowerCase() === statusFilter.toLowerCase()
      )
    : rows;

  return { rows: filteredRows, total };
}

// ─── Fill Rate Trend ────────────────────────────────

export async function getFillRateTrend(
  clubId: string,
  weeks: number = 12
): Promise<FillRatePoint[]> {
  const now = new Date();
  const points: FillRatePoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

    const slots = await prisma.slot.findMany({
      where: {
        clubId,
        startTime: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        requiredPlayers: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    });

    const avgFill =
      slots.length > 0
        ? slots.reduce(
            (sum, s) =>
              sum + Math.min(s._count.participants / s.requiredPlayers, 1),
            0
          ) / slots.length
        : 0;

    points.push({
      week: format(weekStart, "MMM d"),
      fillRate: Math.round(avgFill * 100),
    });
  }

  return points;
}

// ─── Usage Heatmap ──────────────────────────────────

export async function getUsageHeatmap(clubId: string): Promise<HeatmapCell[]> {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const slots = await prisma.slot.findMany({
    where: {
      clubId,
      startTime: { gte: thirtyDaysAgo },
      status: { not: "CANCELLED" },
    },
    select: {
      startTime: true,
      requiredPlayers: true,
      _count: { select: { participants: { where: { status: "JOINED" } } } },
    },
  });

  // Aggregate by day×hour
  const grid: Record<string, { totalFill: number; count: number }> = {};

  for (const slot of slots) {
    const day = getDay(slot.startTime); // 0=Sun
    const hour = getHours(slot.startTime);
    // Round to 2-hour blocks
    const hourBlock = Math.floor(hour / 2) * 2;
    const key = `${day}-${hourBlock}`;

    if (!grid[key]) grid[key] = { totalFill: 0, count: 0 };
    grid[key].totalFill +=
      Math.min(slot._count.participants / slot.requiredPlayers, 1) * 100;
    grid[key].count++;
  }

  const cells: HeatmapCell[] = [];
  // Generate all cells (7 days × time blocks from 6AM to 10PM)
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 20; hour += 2) {
      const key = `${day}-${hour}`;
      const data = grid[key];
      cells.push({
        day,
        hour,
        fillRate: data ? Math.round(data.totalFill / data.count) : 0,
        count: data?.count || 0,
      });
    }
  }

  return cells;
}

// ─── Engagement Metrics ─────────────────────────────

export async function getEngagementMetrics(
  clubId: string
): Promise<EngagementMetrics> {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthStart = startOfMonth(now);

  const [newThisWeek, newThisMonth, sessionCounts, attendance] =
    await Promise.all([
      // New players this week (first time joining any slot at this club)
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT sp."userId") as count
        FROM "SlotParticipant" sp
        JOIN "Slot" s ON s.id = sp."slotId"
        WHERE s."clubId" = ${clubId}
          AND sp.status = 'JOINED'
          AND sp."joinedAt" >= ${weekAgo}
          AND NOT EXISTS (
            SELECT 1 FROM "SlotParticipant" sp2
            JOIN "Slot" s2 ON s2.id = sp2."slotId"
            WHERE s2."clubId" = ${clubId}
              AND sp2."userId" = sp."userId"
              AND sp2.status = 'JOINED'
              AND sp2."joinedAt" < ${weekAgo}
          )
      `,
      // New players this month
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT sp."userId") as count
        FROM "SlotParticipant" sp
        JOIN "Slot" s ON s.id = sp."slotId"
        WHERE s."clubId" = ${clubId}
          AND sp.status = 'JOINED'
          AND sp."joinedAt" >= ${monthStart}
          AND NOT EXISTS (
            SELECT 1 FROM "SlotParticipant" sp2
            JOIN "Slot" s2 ON s2.id = sp2."slotId"
            WHERE s2."clubId" = ${clubId}
              AND sp2."userId" = sp."userId"
              AND sp2.status = 'JOINED'
              AND sp2."joinedAt" < ${monthStart}
          )
      `,
      // Sessions per player
      prisma.slotParticipant.groupBy({
        by: ["userId"],
        where: { slot: { clubId }, status: "JOINED" },
        _count: { _all: true },
      }),
      // No-show data
      prisma.attendance.findMany({
        where: { game: { clubId } },
        select: { present: true },
      }),
    ]);

  const totalPlayers = sessionCounts.length;
  const repeatPlayers = sessionCounts.filter((p) => p._count._all >= 2).length;
  const totalSessions = sessionCounts.reduce(
    (sum, p) => sum + p._count._all,
    0
  );

  const noShows = attendance.filter((a) => !a.present).length;
  const noShowRate =
    attendance.length > 0 ? Math.round((noShows / attendance.length) * 100) : 0;

  return {
    newPlayersThisWeek: Number(newThisWeek[0]?.count ?? 0),
    newPlayersThisMonth: Number(newThisMonth[0]?.count ?? 0),
    repeatRate: totalPlayers > 0 ? Math.round((repeatPlayers / totalPlayers) * 100) : 0,
    avgSessionsPerPlayer:
      totalPlayers > 0
        ? Math.round((totalSessions / totalPlayers) * 10) / 10
        : 0,
    noShowRate,
  };
}

// ─── Player Insights ────────────────────────────────

export async function getPlayerInsights(clubId: string): Promise<{
  skillDistribution: SkillBucket[];
  frequencyBuckets: FrequencyBucket[];
}> {
  const skillLabels: Record<number, string> = {
    1: "Beginner",
    2: "Beginner+",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
  };

  // Get skill levels of players at this club
  const playerIds = await prisma.slotParticipant.findMany({
    where: { slot: { clubId }, status: "JOINED" },
    select: { userId: true },
    distinct: ["userId"],
  });

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: playerIds.map((p) => p.userId) } },
    select: { skillLevel: true },
  });

  // Skill distribution
  const skillCounts: Record<number, number> = {};
  for (const p of profiles) {
    skillCounts[p.skillLevel] = (skillCounts[p.skillLevel] || 0) + 1;
  }
  const skillDistribution: SkillBucket[] = [1, 2, 3, 4, 5].map((level) => ({
    level,
    label: skillLabels[level],
    count: skillCounts[level] || 0,
  }));

  // Frequency buckets
  const sessionCounts = await prisma.slotParticipant.groupBy({
    by: ["userId"],
    where: { slot: { clubId }, status: "JOINED" },
    _count: { _all: true },
  });

  const buckets = { "1 session": 0, "2–3 sessions": 0, "4–6 sessions": 0, "7+ sessions": 0 };
  for (const p of sessionCounts) {
    const c = p._count._all;
    if (c === 1) buckets["1 session"]++;
    else if (c <= 3) buckets["2–3 sessions"]++;
    else if (c <= 6) buckets["4–6 sessions"]++;
    else buckets["7+ sessions"]++;
  }

  const frequencyBuckets: FrequencyBucket[] = Object.entries(buckets).map(
    ([label, count]) => ({ label, count })
  );

  return { skillDistribution, frequencyBuckets };
}

// ─── Value Indicators ───────────────────────────────

export async function getValueIndicators(
  clubId: string
): Promise<ValueIndicators> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalSessionsFilled,
    thisMonthSlots,
    lastMonthSlots,
    thisMonthPlayers,
    lastMonthPlayers,
    revenue,
  ] = await Promise.all([
    prisma.slot.count({
      where: {
        clubId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    }),
    // This month slots for fill rate
    prisma.slot.findMany({
      where: {
        clubId,
        startTime: { gte: thisMonthStart, lte: thisMonthEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        requiredPlayers: true,
        durationMins: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    }),
    // Last month slots
    prisma.slot.findMany({
      where: {
        clubId,
        startTime: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        requiredPlayers: true,
        durationMins: true,
        _count: { select: { participants: { where: { status: "JOINED" } } } },
      },
    }),
    // Unique players this month
    prisma.slotParticipant.findMany({
      where: {
        slot: { clubId },
        status: "JOINED",
        joinedAt: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Unique players last month
    prisma.slotParticipant.findMany({
      where: {
        slot: { clubId },
        status: "JOINED",
        joinedAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Revenue
    prisma.payment.aggregate({
      where: {
        game: { clubId },
        status: "SUCCEEDED",
      },
      _sum: { amountCents: true },
    }),
  ]);

  const calcFillRate = (
    slots: { requiredPlayers: number; _count: { participants: number } }[]
  ) =>
    slots.length > 0
      ? Math.round(
          (slots.reduce(
            (sum, s) =>
              sum + Math.min(s._count.participants / s.requiredPlayers, 1),
            0
          ) /
            slots.length) *
            100
        )
      : 0;

  const calcUtilization = (
    slots: {
      durationMins: number;
      requiredPlayers: number;
      _count: { participants: number };
    }[]
  ) => {
    const totalHours = slots.reduce((sum, s) => sum + s.durationMins / 60, 0);
    const filledHours = slots.reduce(
      (sum, s) =>
        sum +
        (s.durationMins / 60) *
          Math.min(s._count.participants / s.requiredPlayers, 1),
      0
    );
    return totalHours > 0 ? Math.round((filledHours / totalHours) * 100) : 0;
  };

  return {
    totalSessionsFilled,
    fillRateThisMonth: calcFillRate(thisMonthSlots),
    fillRateLastMonth: calcFillRate(lastMonthSlots),
    playerGrowthThisMonth: thisMonthPlayers.length,
    playerGrowthLastMonth: lastMonthPlayers.length,
    courtUtilizationThisMonth: calcUtilization(thisMonthSlots),
    courtUtilizationLastMonth: calcUtilization(lastMonthSlots),
    revenueFacilitated: (revenue._sum.amountCents || 0) / 100,
  };
}

// ─── Monthly Growth Data ────────────────────────────

export async function getMonthlyGrowth(
  clubId: string,
  months: number = 6
): Promise<{
  participationGrowth: MonthlyPoint[];
  fillRateGrowth: MonthlyPoint[];
  sessionVolume: MonthlyPoint[];
}> {
  const now = new Date();
  const participationGrowth: MonthlyPoint[] = [];
  const fillRateGrowth: MonthlyPoint[] = [];
  const sessionVolume: MonthlyPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const label = format(monthStart, "MMM yyyy");

    const [players, slots] = await Promise.all([
      prisma.slotParticipant.findMany({
        where: {
          slot: { clubId },
          status: "JOINED",
          joinedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.slot.findMany({
        where: {
          clubId,
          startTime: { gte: monthStart, lte: monthEnd },
          status: { not: "CANCELLED" },
        },
        select: {
          requiredPlayers: true,
          _count: {
            select: { participants: { where: { status: "JOINED" } } },
          },
        },
      }),
    ]);

    const avgFill =
      slots.length > 0
        ? Math.round(
            (slots.reduce(
              (sum, s) =>
                sum + Math.min(s._count.participants / s.requiredPlayers, 1),
              0
            ) /
              slots.length) *
              100
          )
        : 0;

    participationGrowth.push({ month: label, value: players.length });
    fillRateGrowth.push({ month: label, value: avgFill });
    sessionVolume.push({ month: label, value: slots.length });
  }

  return { participationGrowth, fillRateGrowth, sessionVolume };
}

// ─── Actionable Insights ────────────────────────────

export async function getActionableInsights(
  clubId: string
): Promise<ActionableInsight[]> {
  const insights: ActionableInsight[] = [];
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  // Get recent slot data
  const recentSlots = await prisma.slot.findMany({
    where: {
      clubId,
      startTime: { gte: thirtyDaysAgo },
      status: { not: "CANCELLED" },
    },
    select: {
      startTime: true,
      requiredPlayers: true,
      _count: { select: { participants: { where: { status: "JOINED" } } } },
    },
  });

  // Analyze by day+time
  const timeSlotFills: Record<
    string,
    { fills: number[]; day: string; time: string }
  > = {};
  for (const slot of recentSlots) {
    const day = format(slot.startTime, "EEEE");
    const hour = getHours(slot.startTime);
    const time = `${hour % 12 || 12}–${(hour + 2) % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
    const key = `${day} ${time}`;
    if (!timeSlotFills[key])
      timeSlotFills[key] = { fills: [], day, time };
    timeSlotFills[key].fills.push(
      slot._count.participants / slot.requiredPlayers
    );
  }

  // High-fill slots
  for (const [key, data] of Object.entries(timeSlotFills)) {
    const avgFill =
      data.fills.reduce((a, b) => a + b, 0) / data.fills.length;
    if (avgFill >= 0.9 && data.fills.length >= 2) {
      insights.push({
        type: "success",
        message: `${key} consistently exceeds 90% fill — consider adding a second session`,
      });
    }
  }

  // Low-fill slots
  for (const [key, data] of Object.entries(timeSlotFills)) {
    const avgFill =
      data.fills.reduce((a, b) => a + b, 0) / data.fills.length;
    if (avgFill < 0.4 && data.fills.length >= 2) {
      insights.push({
        type: "warning",
        message: `${key} is below 40% fill — consider promoting or adjusting this time slot`,
      });
    }
  }

  // Fill rate trend
  const previousSlots = await prisma.slot.findMany({
    where: {
      clubId,
      startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      status: { not: "CANCELLED" },
    },
    select: {
      requiredPlayers: true,
      _count: { select: { participants: { where: { status: "JOINED" } } } },
    },
  });

  const recentAvgFill =
    recentSlots.length > 0
      ? recentSlots.reduce(
          (sum, s) => sum + s._count.participants / s.requiredPlayers,
          0
        ) / recentSlots.length
      : 0;

  const prevAvgFill =
    previousSlots.length > 0
      ? previousSlots.reduce(
          (sum, s) => sum + s._count.participants / s.requiredPlayers,
          0
        ) / previousSlots.length
      : 0;

  if (prevAvgFill > 0 && recentAvgFill > prevAvgFill) {
    const improvement = Math.round(
      ((recentAvgFill - prevAvgFill) / prevAvgFill) * 100
    );
    insights.push({
      type: "growth",
      message: `Fill rate is up ${improvement}% vs last month — great momentum!`,
    });
  } else if (prevAvgFill > 0 && recentAvgFill < prevAvgFill * 0.9) {
    insights.push({
      type: "warning",
      message: `Fill rate has dipped compared to last month — consider targeted promotions`,
    });
  }

  // New player signups trend
  const monthStart = startOfMonth(now);
  const newPlayersThisMonth = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT sp."userId") as count
    FROM "SlotParticipant" sp
    JOIN "Slot" s ON s.id = sp."slotId"
    WHERE s."clubId" = ${clubId}
      AND sp.status = 'JOINED'
      AND sp."joinedAt" >= ${monthStart}
      AND NOT EXISTS (
        SELECT 1 FROM "SlotParticipant" sp2
        JOIN "Slot" s2 ON s2.id = sp2."slotId"
        WHERE s2."clubId" = ${clubId}
          AND sp2."userId" = sp."userId"
          AND sp2.status = 'JOINED'
          AND sp2."joinedAt" < ${monthStart}
      )
  `;
  const newCount = Number(newPlayersThisMonth[0]?.count ?? 0);
  if (newCount > 0) {
    insights.push({
      type: "info",
      message: `${newCount} new player${newCount !== 1 ? "s" : ""} joined this month`,
    });
  }

  // Weekend utilization
  const weekendSlots = recentSlots.filter((s) => {
    const day = getDay(s.startTime);
    return day === 0 || day === 6;
  });
  if (weekendSlots.length > 0) {
    const weekendFill =
      weekendSlots.reduce(
        (sum, s) => sum + s._count.participants / s.requiredPlayers,
        0
      ) / weekendSlots.length;
    if (weekendFill < 0.5) {
      insights.push({
        type: "info",
        message: `Weekend slots have room to grow — try a weekend promotion`,
      });
    }
  }

  // Skill level distribution check
  const playerIds = await prisma.slotParticipant.findMany({
    where: { slot: { clubId }, status: "JOINED" },
    select: { userId: true },
    distinct: ["userId"],
  });
  if (playerIds.length > 0) {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: playerIds.map((p) => p.userId) } },
      select: { skillLevel: true },
    });
    const skillCounts: Record<number, number> = {};
    for (const p of profiles) {
      skillCounts[p.skillLevel] = (skillCounts[p.skillLevel] || 0) + 1;
    }
    const total = profiles.length;
    for (const [level, count] of Object.entries(skillCounts)) {
      if (count / total < 0.1 && Number(level) >= 4) {
        insights.push({
          type: "info",
          message: `Only ${Math.round((count / total) * 100)}% of your players are Advanced/Expert — consider an advanced-only session`,
        });
        break;
      }
    }
  }

  return insights;
}
