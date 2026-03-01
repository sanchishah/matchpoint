import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildMatchmakingContext, scoreSlot } from "@/lib/matchmaking-scoring";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.lat || !profile?.lng) {
    return NextResponse.json(
      { error: "Location incomplete", suggestion: "Update your profile with a valid zip code" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const now = new Date();
  const dateFrom = url.searchParams.get("dateFrom")
    ? new Date(url.searchParams.get("dateFrom")!)
    : now;
  const dateTo = url.searchParams.get("dateTo")
    ? new Date(url.searchParams.get("dateTo")!)
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expandRadius = url.searchParams.get("expandRadius") === "true";
  const radiusMilesParam = Number(url.searchParams.get("radiusMiles")) || 0;
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);

  const effectiveRadius =
    expandRadius && radiusMilesParam > profile.radiusMiles
      ? radiusMilesParam
      : profile.radiusMiles;

  const [slots, context] = await Promise.all([
    prisma.slot.findMany({
      where: {
        status: { in: ["OPEN", "PENDING_FILL"] },
        startTime: { gte: dateFrom, lte: dateTo },
        lockTime: { gt: now },
        // Single-court launch: only show APJCC Los Gatos
        club: { slug: "los-gatos" },
      },
      include: {
        club: true,
        participants: {
          where: { status: "JOINED" },
          select: { userId: true },
        },
      },
    }),
    buildMatchmakingContext(session.user.id, {
      skillLevel: profile.skillLevel,
      ageBracket: profile.ageBracket,
      lat: profile.lat,
      lng: profile.lng,
      radiusMiles: profile.radiusMiles,
    }),
  ]);

  // Batch-fetch avg ratings for all participant userIds
  const allParticipantIds = [
    ...new Set(slots.flatMap((s) => s.participants.map((p) => p.userId))),
  ];
  const participantAvgRatings = new Map<string, number>();

  if (allParticipantIds.length > 0) {
    const ratings = await prisma.rating.groupBy({
      by: ["rateeId"],
      where: { rateeId: { in: allParticipantIds } },
      _avg: { stars: true },
    });
    for (const r of ratings) {
      if (r._avg.stars !== null) {
        participantAvgRatings.set(r.rateeId, r._avg.stars);
      }
    }
  }

  const scored = slots
    .map((slot) => {
      const participantUserIds = slot.participants.map((p) => p.userId);
      const result = scoreSlot(
        slot,
        participantUserIds,
        participantAvgRatings,
        context,
        now,
        dateTo,
        effectiveRadius
      );

      if (!result) return null;

      return {
        slot: {
          id: slot.id,
          clubId: slot.clubId,
          club: slot.club,
          startTime: slot.startTime,
          durationMins: slot.durationMins,
          format: slot.format,
          requiredPlayers: slot.requiredPlayers,
          totalCostCents: slot.totalCostCents,
          skillLevel: slot.skillLevel,
          ageBracket: slot.ageBracket,
          status: slot.status,
          lockTime: slot.lockTime,
          joinedCount: participantUserIds.length,
        },
        score: result.score,
        reasons: result.reasons,
        distance: result.distance,
        friendsInSlot: result.friendsInSlot,
      };
    })
    .filter(Boolean) as Array<{
      slot: Record<string, unknown>;
      score: number;
      reasons: string[];
      distance: number;
      friendsInSlot: number;
    }>;

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json(scored.slice(0, limit));
}
