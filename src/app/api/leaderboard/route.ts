import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "games";

  if (sort === "games") {
    const participants = await prisma.gameParticipant.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 20,
    });

    const userIds = participants.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        profile: { select: { name: true, skillLevel: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = participants.map((p, i) => {
      const user = userMap.get(p.userId);
      return {
        rank: i + 1,
        userId: p.userId,
        name: user?.profile?.name || user?.name || "Player",
        avatarUrl: user?.avatarUrl || null,
        skillLevel: user?.profile?.skillLevel || null,
        gamesPlayed: p._count.userId,
      };
    });

    return NextResponse.json(leaderboard);
  }

  if (sort === "rating") {
    const ratings = await prisma.rating.groupBy({
      by: ["rateeId"],
      _avg: { stars: true },
      _count: { rateeId: true },
      having: { rateeId: { _count: { gte: 3 } } },
      orderBy: { _avg: { stars: "desc" } },
      take: 20,
    });

    const userIds = ratings.map((r) => r.rateeId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        profile: { select: { name: true, skillLevel: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = ratings.map((r, i) => {
      const user = userMap.get(r.rateeId);
      return {
        rank: i + 1,
        userId: r.rateeId,
        name: user?.profile?.name || user?.name || "Player",
        avatarUrl: user?.avatarUrl || null,
        skillLevel: user?.profile?.skillLevel || null,
        avgRating: Math.round((r._avg.stars || 0) * 10) / 10,
        ratingCount: r._count.rateeId,
      };
    });

    return NextResponse.json(leaderboard);
  }

  if (sort === "streak") {
    // Compute consecutive weeks with games per user
    const allParticipants = await prisma.gameParticipant.findMany({
      select: {
        userId: true,
        game: { select: { startTime: true } },
      },
      orderBy: { game: { startTime: "desc" } },
    });

    // Group game dates by user
    const userWeeks = new Map<string, Set<string>>();
    for (const p of allParticipants) {
      const date = new Date(p.game.startTime);
      // Get ISO week identifier
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

      if (!userWeeks.has(p.userId)) userWeeks.set(p.userId, new Set());
      userWeeks.get(p.userId)!.add(weekKey);
    }

    // Calculate streak for each user
    const streaks: { userId: string; streak: number }[] = [];
    for (const [userId, weeks] of userWeeks) {
      const sorted = [...weeks].sort().reverse();
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const curr = new Date(sorted[i - 1]);
        const prev = new Date(sorted[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
          streak++;
        } else {
          break;
        }
      }
      streaks.push({ userId, streak });
    }

    streaks.sort((a, b) => b.streak - a.streak);
    const top20 = streaks.slice(0, 20);

    const userIds = top20.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        profile: { select: { name: true, skillLevel: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = top20.map((s, i) => {
      const user = userMap.get(s.userId);
      return {
        rank: i + 1,
        userId: s.userId,
        name: user?.profile?.name || user?.name || "Player",
        avatarUrl: user?.avatarUrl || null,
        skillLevel: user?.profile?.skillLevel || null,
        streak: s.streak,
      };
    });

    return NextResponse.json(leaderboard);
  }

  return NextResponse.json({ error: "Invalid sort parameter" }, { status: 400 });
}
