import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      slots: {
        where: {
          status: { in: ["OPEN", "PENDING_FILL"] },
          startTime: { gt: new Date() },
        },
        include: {
          participants: {
            where: { status: { in: ["JOINED", "WAITLISTED"] } },
            select: { userId: true, status: true },
          },
        },
        orderBy: { startTime: "asc" },
        take: 20,
      },
    },
  });

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Get club stats
  const [totalGames, uniquePlayers, avgRating] = await Promise.all([
    prisma.game.count({ where: { clubId: id } }),
    prisma.gameParticipant.findMany({
      where: { game: { clubId: id } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.rating.aggregate({
      where: { game: { clubId: id } },
      _avg: { stars: true },
    }),
  ]);

  const upcomingSlots = club.slots.map((slot) => {
    const joinedCount = slot.participants.filter((p) => p.status === "JOINED").length;
    return {
      id: slot.id,
      startTime: slot.startTime,
      durationMins: slot.durationMins,
      format: slot.format,
      requiredPlayers: slot.requiredPlayers,
      totalCostCents: slot.totalCostCents,
      perPersonCents: Math.round(slot.totalCostCents / slot.requiredPlayers),
      skillLevel: slot.skillLevel,
      ageBracket: slot.ageBracket,
      joinedCount,
      spotsLeft: slot.requiredPlayers - joinedCount,
    };
  });

  return NextResponse.json({
    id: club.id,
    name: club.name,
    address: club.address,
    city: club.city,
    state: club.state,
    zip: club.zip,
    lat: club.lat,
    lng: club.lng,
    notes: club.notes,
    stats: {
      totalGames,
      totalPlayers: uniquePlayers.length,
      avgRating: avgRating._avg.stars
        ? Math.round(avgRating._avg.stars * 10) / 10
        : null,
    },
    upcomingSlots,
  });
}
