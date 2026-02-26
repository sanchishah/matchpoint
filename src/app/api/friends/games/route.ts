import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get accepted friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );

  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }

  // Find friends' upcoming games
  const friendParticipations = await prisma.gameParticipant.findMany({
    where: {
      userId: { in: friendIds },
      game: {
        status: "CONFIRMED",
        startTime: { gt: new Date() },
      },
    },
    include: {
      user: {
        select: { id: true, name: true, profile: { select: { name: true } } },
      },
      game: {
        include: {
          slot: {
            include: { club: { select: { id: true, name: true, city: true } } },
          },
        },
      },
    },
    orderBy: { game: { startTime: "asc" } },
  });

  // Group by game
  const gameMap = new Map<string, {
    id: string;
    startTime: Date;
    format: string;
    club: { id: string; name: string; city: string };
    friends: { id: string; name: string }[];
  }>();

  for (const p of friendParticipations) {
    const game = p.game;
    if (!gameMap.has(game.id)) {
      gameMap.set(game.id, {
        id: game.id,
        startTime: game.startTime,
        format: game.slot.format,
        club: game.slot.club,
        friends: [],
      });
    }
    gameMap.get(game.id)!.friends.push({
      id: p.user.id,
      name: p.user.profile?.name || p.user.name || "Player",
    });
  }

  return NextResponse.json(Array.from(gameMap.values()));
}
