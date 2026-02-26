import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          name: true,
          skillLevel: true,
          ageBracket: true,
        },
      },
      ratingsReceived: {
        select: { stars: true },
      },
      gameParticipants: {
        select: {
          game: {
            select: {
              id: true,
              startTime: true,
              slot: {
                select: {
                  format: true,
                  club: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { game: { startTime: "desc" } },
        take: 5,
      },
      _count: {
        select: { gameParticipants: true },
      },
    },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const ratings = user.ratingsReceived;
  const avgRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10
        ) / 10
      : 0;

  const recentGames = user.gameParticipants.map((gp) => ({
    id: gp.game.id,
    clubName: gp.game.slot.club.name,
    date: gp.game.startTime,
    format: gp.game.slot.format,
  }));

  // Determine friendship status with current user
  let friendshipStatus: string | null = null;
  let friendshipId: string | null = null;

  if (session?.user?.id && session.user.id !== id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: id },
          { requesterId: id, addresseeId: session.user.id },
        ],
      },
    });

    if (friendship) {
      friendshipId = friendship.id;
      if (friendship.status === "ACCEPTED") {
        friendshipStatus = "ACCEPTED";
      } else if (friendship.status === "PENDING") {
        friendshipStatus =
          friendship.requesterId === session.user.id ? "PENDING_SENT" : "PENDING_RECEIVED";
      }
    }
  }

  return NextResponse.json({
    id: user.id,
    name: user.profile.name,
    skillLevel: user.profile.skillLevel,
    ageBracket: user.profile.ageBracket,
    gamesPlayed: user._count.gameParticipants,
    avgRating,
    ratingCount: ratings.length,
    recentGames,
    friendshipStatus,
    friendshipId,
  });
}
