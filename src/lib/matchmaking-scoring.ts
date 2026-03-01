import { prisma } from "@/lib/db";
import { distanceMiles, skillLabel, ageBracketLabel } from "@/lib/constants";

export interface MatchmakingContext {
  userId: string;
  profile: {
    skillLevel: number;
    ageBracket: string;
    lat: number;
    lng: number;
    radiusMiles: number;
  };
  friendIds: Set<string>;
  recentOpponentIds: Set<string>;
  avgRatingReceived: number | null;
  formatCounts: { SINGLES: number; DOUBLES: number };
  playTimeHistogram: Map<number, number>; // hour -> count
}

export interface ScoreResult {
  score: number;
  reasons: string[];
  distance: number;
  friendsInSlot: number;
}

export async function buildMatchmakingContext(
  userId: string,
  profile: MatchmakingContext["profile"]
): Promise<MatchmakingContext> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [friendships, recentGames, ratingAgg, pastGames] = await Promise.all([
    // Friends (accepted)
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    }),

    // Recent opponents (last 30 days)
    prisma.gameParticipant.findMany({
      where: {
        game: {
          startTime: { gte: thirtyDaysAgo },
          participants: { some: { userId } },
        },
        userId: { not: userId },
      },
      select: { userId: true },
    }),

    // Average rating received
    prisma.rating.aggregate({
      where: { rateeId: userId },
      _avg: { stars: true },
    }),

    // Past games for format counts + play time histogram
    prisma.gameParticipant.findMany({
      where: { userId },
      select: {
        game: {
          select: {
            startTime: true,
            slot: { select: { format: true } },
          },
        },
      },
    }),
  ]);

  const friendIds = new Set(
    friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    )
  );

  const recentOpponentIds = new Set(recentGames.map((g) => g.userId));

  const formatCounts = { SINGLES: 0, DOUBLES: 0 };
  const playTimeHistogram = new Map<number, number>();

  for (const pg of pastGames) {
    const fmt = pg.game.slot.format as "SINGLES" | "DOUBLES";
    formatCounts[fmt]++;
    const hour = pg.game.startTime.getHours();
    playTimeHistogram.set(hour, (playTimeHistogram.get(hour) || 0) + 1);
  }

  return {
    userId,
    profile,
    friendIds,
    recentOpponentIds,
    avgRatingReceived: ratingAgg._avg.stars,
    formatCounts,
    playTimeHistogram,
  };
}

/**
 * Score a slot for a user. Returns null if the slot is out of range.
 *
 * @param slot - The slot with club data and participant user IDs
 * @param participantUserIds - User IDs of JOINED participants in this slot
 * @param participantAvgRatings - Map of userId -> avg rating for slot participants
 * @param context - The user's matchmaking context
 * @param now - Current timestamp
 * @param dateTo - End of the search window
 * @param effectiveRadius - Maximum distance in miles
 */
export function scoreSlot(
  slot: {
    id: string;
    skillLevel: number;
    ageBracket: string;
    format: string;
    startTime: Date;
    club: { lat: number; lng: number };
  },
  participantUserIds: string[],
  participantAvgRatings: Map<string, number>,
  context: MatchmakingContext,
  now: Date,
  dateTo: Date,
  effectiveRadius: number
): ScoreResult | null {
  const dist = distanceMiles(
    context.profile.lat,
    context.profile.lng,
    slot.club.lat,
    slot.club.lng
  );
  if (dist > effectiveRadius) return null;

  let score = 0;
  const reasons: string[] = [];

  // Skill match: +30
  if (slot.skillLevel === context.profile.skillLevel) {
    score += 30;
    reasons.push(`Skill match (${skillLabel(slot.skillLevel)})`);
  }

  // Age bracket match: +20
  if (slot.ageBracket === context.profile.ageBracket) {
    score += 20;
    reasons.push(`Age bracket match (${ageBracketLabel(slot.ageBracket)})`);
  }

  // Distance score: (1 - dist/radius) * 15
  const distScore = (1 - dist / effectiveRadius) * 15;
  score += distScore;
  reasons.push(`Within ${dist.toFixed(1)} miles`);

  // Time score: closer to now = higher (up to 5)
  const msUntilStart = slot.startTime.getTime() - now.getTime();
  const maxMs = dateTo.getTime() - now.getTime();
  const timeScore = maxMs > 0 ? (1 - msUntilStart / maxMs) * 5 : 0;
  score += Math.max(timeScore, 0);

  // Rating affinity: +10
  if (context.avgRatingReceived !== null && participantUserIds.length > 0) {
    const participantRatings = participantUserIds
      .map((uid) => participantAvgRatings.get(uid))
      .filter((r): r is number => r !== undefined);

    if (participantRatings.length > 0) {
      const slotAvg =
        participantRatings.reduce((a, b) => a + b, 0) /
        participantRatings.length;
      const ratingScore =
        10 * (1 - Math.abs(context.avgRatingReceived - slotAvg) / 4);
      score += Math.max(ratingScore, 0);
      if (ratingScore >= 5) {
        reasons.push("Similar player ratings");
      }
    }
  }

  // Friends boost: +10 (5 per friend, max 10)
  const friendsInSlot = participantUserIds.filter((uid) =>
    context.friendIds.has(uid)
  ).length;
  if (friendsInSlot > 0) {
    score += Math.min(friendsInSlot * 5, 10);
    reasons.push(
      `${friendsInSlot} friend${friendsInSlot > 1 ? "s" : ""} playing`
    );
  }

  // Opponent variety: +5 if no recent opponents
  const hasRecentOpponent = participantUserIds.some((uid) =>
    context.recentOpponentIds.has(uid)
  );
  if (!hasRecentOpponent && participantUserIds.length > 0) {
    score += 5;
    reasons.push("New opponents");
  }

  // Play frequency: +3 if slot hour matches peak
  if (context.playTimeHistogram.size > 0) {
    const slotHour = slot.startTime.getHours();
    let peakHour = 0;
    let peakCount = 0;
    for (const [hour, count] of context.playTimeHistogram) {
      if (count > peakCount) {
        peakHour = hour;
        peakCount = count;
      }
    }
    if (slotHour === peakHour) {
      score += 3;
      reasons.push("Your peak play time");
    }
  }

  // Format preference: +2 if matches most-played format
  const preferredFormat =
    context.formatCounts.SINGLES >= context.formatCounts.DOUBLES
      ? "SINGLES"
      : "DOUBLES";
  const totalGames =
    context.formatCounts.SINGLES + context.formatCounts.DOUBLES;
  if (totalGames > 0 && slot.format === preferredFormat) {
    score += 2;
    reasons.push(
      `${slot.format === "SINGLES" ? "Singles" : "Doubles"} — your preferred format`
    );
  }

  return {
    score: Math.round(score * 10) / 10,
    reasons,
    distance: Math.round(dist * 10) / 10,
    friendsInSlot,
  };
}
