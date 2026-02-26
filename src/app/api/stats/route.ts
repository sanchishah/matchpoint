import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Gather all stats in parallel
  const [
    totalGames,
    gameParticipants,
    ratingsReceived,
    profile,
    gameScores,
  ] = await Promise.all([
    prisma.gameParticipant.count({ where: { userId } }),
    prisma.gameParticipant.findMany({
      where: { userId },
      select: {
        game: {
          select: {
            id: true,
            startTime: true,
            slot: {
              select: {
                club: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.rating.findMany({
      where: { rateeId: userId },
      select: { stars: true, feltLevel: true },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { name: true },
    }),
    // Get all scores for games the user participated in
    prisma.gameScore.findMany({
      where: {
        game: {
          participants: { some: { userId } },
        },
      },
      select: {
        gameId: true,
        team1Score: true,
        team2Score: true,
      },
    }),
  ]);

  // Average rating
  const avgRating =
    ratingsReceived.length > 0
      ? Math.round(
          (ratingsReceived.reduce((sum, r) => sum + r.stars, 0) /
            ratingsReceived.length) *
            10
        ) / 10
      : 0;

  // Rating breakdown: {1: count, 2: count, ...5: count}
  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingsReceived) {
    ratingBreakdown[r.stars] = (ratingBreakdown[r.stars] || 0) + 1;
  }

  // Felt level breakdown
  const feltLevelBreakdown: Record<string, number> = { BELOW: 0, AT: 0, ABOVE: 0 };
  for (const r of ratingsReceived) {
    feltLevelBreakdown[r.feltLevel] = (feltLevelBreakdown[r.feltLevel] || 0) + 1;
  }

  // Games by month (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const gamesByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    gamesByMonth.push({ month: label, count: 0 });
  }

  for (const gp of gameParticipants) {
    const gameDate = new Date(gp.game.startTime);
    if (gameDate >= sixMonthsAgo) {
      const label = `${monthNames[gameDate.getMonth()]} ${gameDate.getFullYear()}`;
      const entry = gamesByMonth.find((m) => m.month === label);
      if (entry) entry.count++;
    }
  }

  // Favorite club (most games played at)
  const clubCounts: Record<string, number> = {};
  for (const gp of gameParticipants) {
    const clubName = gp.game.slot.club.name;
    clubCounts[clubName] = (clubCounts[clubName] || 0) + 1;
  }
  const favoriteClub =
    Object.keys(clubCounts).length > 0
      ? Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Win/loss record based on scores
  let gamesWon = 0;
  let gamesLost = 0;
  for (const score of gameScores) {
    if (score.team1Score > score.team2Score) {
      gamesWon++;
    } else if (score.team2Score > score.team1Score) {
      gamesLost++;
    }
  }

  return NextResponse.json({
    playerName: profile?.name || session.user.name || "Player",
    totalGames,
    avgRating,
    ratingCount: ratingsReceived.length,
    ratingBreakdown,
    feltLevelBreakdown,
    gamesByMonth,
    gamesWon,
    gamesLost,
    favoriteClub,
  });
}
