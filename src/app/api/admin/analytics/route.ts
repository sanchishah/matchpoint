import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    signupsPerWeek,
    revenuePerWeek,
    gamesPerWeek,
    activeUsersResult,
    retentionData,
    topClubs,
  ] = await Promise.all([
    // Signups per week (last 12 weeks)
    prisma.$queryRaw<{ week: string; count: bigint }[]>`
      SELECT
        date_trunc('week', "createdAt")::date::text AS week,
        COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${twelveWeeksAgo}
      GROUP BY date_trunc('week', "createdAt")
      ORDER BY week ASC
    `,

    // Revenue per week (last 12 weeks, only succeeded payments)
    prisma.$queryRaw<{ week: string; totalCents: bigint }[]>`
      SELECT
        date_trunc('week', "createdAt")::date::text AS week,
        COALESCE(SUM("amountCents"), 0)::bigint AS "totalCents"
      FROM "Payment"
      WHERE "createdAt" >= ${twelveWeeksAgo}
        AND "status" = 'SUCCEEDED'
      GROUP BY date_trunc('week', "createdAt")
      ORDER BY week ASC
    `,

    // Games per week (last 12 weeks)
    prisma.$queryRaw<{ week: string; count: bigint }[]>`
      SELECT
        date_trunc('week', "createdAt")::date::text AS week,
        COUNT(*)::bigint AS count
      FROM "Game"
      WHERE "createdAt" >= ${twelveWeeksAgo}
      GROUP BY date_trunc('week', "createdAt")
      ORDER BY week ASC
    `,

    // Active users (participated in a game in the last 30 days)
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT gp."userId")::bigint AS count
      FROM "GameParticipant" gp
      JOIN "Game" g ON g."id" = gp."gameId"
      WHERE g."createdAt" >= ${thirtyDaysAgo}
    `,

    // Retention: users with 2+ games vs users with 1+ games
    prisma.$queryRaw<{ total_with_games: bigint; retained: bigint }[]>`
      SELECT
        COUNT(*) FILTER (WHERE game_count >= 1)::bigint AS total_with_games,
        COUNT(*) FILTER (WHERE game_count >= 2)::bigint AS retained
      FROM (
        SELECT "userId", COUNT(*) AS game_count
        FROM "GameParticipant"
        GROUP BY "userId"
      ) sub
    `,

    // Top 5 clubs by game count
    prisma.$queryRaw<{ name: string; city: string; gameCount: bigint }[]>`
      SELECT
        c."name",
        c."city",
        COUNT(g."id")::bigint AS "gameCount"
      FROM "Club" c
      JOIN "Slot" s ON s."clubId" = c."id"
      JOIN "Game" g ON g."slotId" = s."id"
      GROUP BY c."id", c."name", c."city"
      ORDER BY "gameCount" DESC
      LIMIT 5
    `,
  ]);

  // Convert bigints to numbers for JSON serialization
  const activeUsers = Number(activeUsersResult[0]?.count ?? 0);

  const totalWithGames = Number(retentionData[0]?.total_with_games ?? 0);
  const retained = Number(retentionData[0]?.retained ?? 0);
  const retentionRate = totalWithGames > 0
    ? Math.round((retained / totalWithGames) * 100)
    : 0;

  const totalRevenueCents = revenuePerWeek.reduce(
    (sum, r) => sum + Number(r.totalCents),
    0
  );

  return NextResponse.json({
    signupsPerWeek: signupsPerWeek.map((r) => ({
      week: r.week,
      count: Number(r.count),
    })),
    revenuePerWeek: revenuePerWeek.map((r) => ({
      week: r.week,
      totalCents: Number(r.totalCents),
    })),
    gamesPerWeek: gamesPerWeek.map((r) => ({
      week: r.week,
      count: Number(r.count),
    })),
    activeUsers,
    retentionRate,
    totalRevenueCents,
    topClubs: topClubs.map((c) => ({
      name: c.name,
      city: c.city,
      gameCount: Number(c.gameCount),
    })),
  });
}
