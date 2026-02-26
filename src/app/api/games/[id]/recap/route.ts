import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      slot: { include: { club: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { name: true } },
            },
          },
        },
      },
      score: true,
      ratings: { select: { rateeId: true, stars: true } },
      attendances: { select: { userId: true, present: true } },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "COMPLETED") {
    return NextResponse.json({ error: "Recap only available for completed games" }, { status: 400 });
  }

  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // MVP: highest-rated player in this game
  const playerRatings = new Map<string, { total: number; count: number }>();
  for (const r of game.ratings) {
    const existing = playerRatings.get(r.rateeId) || { total: 0, count: 0 };
    existing.total += r.stars;
    existing.count++;
    playerRatings.set(r.rateeId, existing);
  }

  let mvp: { userId: string; name: string; avgRating: number } | null = null;
  let highestAvg = 0;
  for (const [userId, stats] of playerRatings) {
    const avg = stats.total / stats.count;
    if (avg > highestAvg) {
      highestAvg = avg;
      const participant = game.participants.find((p) => p.userId === userId);
      mvp = {
        userId,
        name: participant?.user.profile?.name || participant?.user.name || "Player",
        avgRating: Math.round(avg * 10) / 10,
      };
    }
  }

  // Average rating across all ratings in this game
  const allRatingsAvg =
    game.ratings.length > 0
      ? Math.round(
          (game.ratings.reduce((sum, r) => sum + r.stars, 0) / game.ratings.length) * 10
        ) / 10
      : null;

  // Attendance rate
  const totalParticipants = game.participants.length;
  const presentCount = game.attendances.filter((a) => a.present).length;
  const attendanceRate =
    game.attendances.length > 0
      ? Math.round((presentCount / totalParticipants) * 100)
      : null;

  // Generate summary text
  const formatLabel = game.slot.format === "SINGLES" ? "Singles" : "Doubles";
  let summary = `${formatLabel} game at ${game.slot.club.name} with ${totalParticipants} players.`;
  if (game.score) {
    summary += ` Final score: ${game.score.team1Score}-${game.score.team2Score}.`;
  }
  if (mvp) {
    summary += ` MVP: ${mvp.name} (${mvp.avgRating} avg rating).`;
  }

  return NextResponse.json({
    score: game.score
      ? { team1Score: game.score.team1Score, team2Score: game.score.team2Score }
      : null,
    mvp,
    avgRating: allRatingsAvg,
    attendanceRate,
    totalParticipants,
    summary,
  });
}
