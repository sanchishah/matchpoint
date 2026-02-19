import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { distanceMiles, skillLabel, ageBracketLabel } from "@/lib/constants";

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

  const slots = await prisma.slot.findMany({
    where: {
      status: { in: ["OPEN", "PENDING_FILL"] },
      startTime: { gte: dateFrom, lte: dateTo },
      lockTime: { gt: now },
    },
    include: {
      club: true,
      _count: { select: { participants: { where: { status: "JOINED" } } } },
    },
  });

  // Filter by distance and score
  const scored = slots
    .map((slot) => {
      const dist = distanceMiles(
        profile.lat!,
        profile.lng!,
        slot.club.lat,
        slot.club.lng
      );
      if (dist > effectiveRadius) return null;

      let score = 0;
      const reasons: string[] = [];

      // Skill match: +40
      if (slot.skillLevel === profile.skillLevel) {
        score += 40;
        reasons.push(`Skill match (${skillLabel(slot.skillLevel)})`);
      }

      // Age bracket match: +30
      if (slot.ageBracket === profile.ageBracket) {
        score += 30;
        reasons.push(`Age bracket match (${ageBracketLabel(slot.ageBracket)})`);
      }

      // Distance score: (1 - dist/radius) * 20
      const distScore = (1 - dist / effectiveRadius) * 20;
      score += distScore;
      reasons.push(`Within ${dist.toFixed(1)} miles`);

      // Time score: closer to now gets more points (up to 10)
      const msUntilStart = slot.startTime.getTime() - now.getTime();
      const maxMs = dateTo.getTime() - now.getTime();
      const timeScore = maxMs > 0 ? (1 - msUntilStart / maxMs) * 10 : 0;
      score += Math.max(timeScore, 0);

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
          joinedCount: slot._count.participants,
        },
        score: Math.round(score * 10) / 10,
        reasons,
        distance: Math.round(dist * 10) / 10,
      };
    })
    .filter(Boolean) as Array<{
      slot: Record<string, unknown>;
      score: number;
      reasons: string[];
      distance: number;
    }>;

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json(scored.slice(0, limit));
}
