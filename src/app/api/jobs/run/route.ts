import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, reminderEmail, chatOpenEmail, shouldSendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { confirmGame } from "@/lib/game-service";
import { distanceMiles } from "@/lib/constants";
import { buildMatchmakingContext, scoreSlot } from "@/lib/matchmaking-scoring";
import { availabilityMatchEmailHtml, availabilityMatchEmailText } from "@/lib/emails/availability-match";
import { format } from "date-fns";

// This endpoint can be triggered manually in dev or by Vercel Cron in production
// Recommended cron: every 15 minutes
export async function POST() {
  const now = new Date();
  const results: string[] = [];

  // 1. Send 24h reminders
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const games24h = await prisma.game.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { gte: in23h, lte: in24h },
    },
    include: {
      slot: { include: { club: true } },
      participants: { include: { user: { include: { profile: true } } } },
    },
  });

  for (const game of games24h) {
    for (const p of game.participants) {
      const name = p.user.profile?.name || p.user.name || "Player";
      const dateStr = format(game.startTime, "EEEE, MMM d 'at' h:mm a");
      if (await shouldSendEmail(p.userId, "reminders")) {
        const email = reminderEmail(name, game.slot.club.name, dateStr, 24);
        await sendEmail({ to: p.user.email, ...email });
      }

      await prisma.notification.create({
        data: {
          userId: p.userId,
          type: "REMINDER_24H",
          title: "Game Tomorrow!",
          body: `Your game at ${game.slot.club.name} is in 24 hours.`,
        },
      });
      sendPushToUser(p.userId, {
        title: "Game Tomorrow!",
        body: `Your game at ${game.slot.club.name} is in 24 hours.`,
        url: `/games/${game.id}`,
      }).catch(() => {});
    }
    results.push(`24h reminder sent for game ${game.id}`);
  }

  // 2. Send 2h reminders
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const games2h = await prisma.game.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { gte: in1h, lte: in2h },
    },
    include: {
      slot: { include: { club: true } },
      participants: { include: { user: { include: { profile: true } } } },
    },
  });

  for (const game of games2h) {
    for (const p of game.participants) {
      const name = p.user.profile?.name || p.user.name || "Player";
      const dateStr = format(game.startTime, "h:mm a");
      if (await shouldSendEmail(p.userId, "reminders")) {
        const email = reminderEmail(name, game.slot.club.name, dateStr, 2);
        await sendEmail({ to: p.user.email, ...email });
      }

      await prisma.notification.create({
        data: {
          userId: p.userId,
          type: "REMINDER_2H",
          title: "Game in 2 Hours!",
          body: `Your game at ${game.slot.club.name} starts at ${dateStr}.`,
        },
      });
      sendPushToUser(p.userId, {
        title: "Game in 2 Hours!",
        body: `Your game at ${game.slot.club.name} starts at ${dateStr}.`,
        url: `/games/${game.id}`,
      }).catch(() => {});
    }
    results.push(`2h reminder sent for game ${game.id}`);
  }

  // 3. Chat open notifications (15 min before)
  const in15m = new Date(now.getTime() + 15 * 60 * 1000);
  const in5m = new Date(now.getTime() + 5 * 60 * 1000);
  const gamesChatOpen = await prisma.game.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { gte: in5m, lte: in15m },
    },
    include: {
      slot: { include: { club: true } },
      participants: { include: { user: { include: { profile: true } } } },
    },
  });

  for (const game of gamesChatOpen) {
    for (const p of game.participants) {
      const name = p.user.profile?.name || p.user.name || "Player";
      if (await shouldSendEmail(p.userId, "chatNotifications")) {
        const email = chatOpenEmail(name, game.slot.club.name);
        await sendEmail({ to: p.user.email, ...email });
      }

      await prisma.notification.create({
        data: {
          userId: p.userId,
          type: "CHAT_OPEN",
          title: "Chat is Open!",
          body: `The game chat for ${game.slot.club.name} is now open. Coordinate with your fellow players!`,
        },
      });
      sendPushToUser(p.userId, {
        title: "Chat is Open!",
        body: `Game chat for ${game.slot.club.name} is now open.`,
        url: `/games/${game.id}`,
      }).catch(() => {});
    }
    results.push(`Chat open notification sent for game ${game.id}`);
  }

  // 4. Auto-expire old OPEN/PENDING_FILL slots that have passed
  const expiredSlots = await prisma.slot.updateMany({
    where: {
      status: { in: ["OPEN", "PENDING_FILL"] },
      startTime: { lt: now },
    },
    data: { status: "CANCELLED" },
  });
  if (expiredSlots.count > 0) {
    results.push(`Expired ${expiredSlots.count} unfilled slots`);
  }

  // 5. Auto-complete games whose endTime has passed
  const completedGames = await prisma.game.updateMany({
    where: {
      status: "CONFIRMED",
      endTime: { lt: now },
    },
    data: { status: "COMPLETED" },
  });
  if (completedGames.count > 0) {
    // Also mark corresponding slots as COMPLETED
    await prisma.slot.updateMany({
      where: {
        game: {
          status: "COMPLETED",
          endTime: { lt: now },
        },
        status: "CONFIRMED",
      },
      data: { status: "COMPLETED" },
    });
    results.push(`Auto-completed ${completedGames.count} past games`);
  }

  // 6. Auto-join recurring subscribers to future slots
  const activeSubscriptions = await prisma.recurringSubscription.findMany({
    where: { active: true },
    include: {
      user: { include: { profile: true } },
    },
  });

  let recurringJoins = 0;
  for (const sub of activeSubscriptions) {
    if (!sub.user.profile) continue;

    // Find future OPEN/PENDING_FILL slots in this series where user is not a participant
    const futureSlots = await prisma.slot.findMany({
      where: {
        recurringGroupId: sub.recurringGroupId,
        status: { in: ["OPEN", "PENDING_FILL"] },
        startTime: { gt: now },
        participants: {
          none: { userId: sub.userId },
        },
      },
      include: {
        participants: { where: { status: "JOINED" }, select: { id: true } },
      },
    });

    for (const slot of futureSlots) {
      // Check skill/age match
      if (sub.user.profile.skillLevel !== slot.skillLevel) continue;
      if (sub.user.profile.ageBracket !== slot.ageBracket) continue;

      // Check capacity
      const joinedCount = slot.participants.length;
      if (joinedCount >= slot.requiredPlayers) continue;

      await prisma.slotParticipant.create({
        data: { slotId: slot.id, userId: sub.userId, status: "JOINED" },
      });

      if (joinedCount === 0) {
        await prisma.slot.update({
          where: { id: slot.id },
          data: { status: "PENDING_FILL" },
        });
      }

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          type: "RECURRING_AUTO_JOIN",
          title: "Auto-joined to game",
          body: `You've been auto-joined to a recurring game slot.`,
        },
      });

      // Check if game should confirm
      if (joinedCount + 1 >= slot.requiredPlayers) {
        confirmGame(slot.id).catch(() => {});
      }

      recurringJoins++;
    }
  }
  if (recurringJoins > 0) {
    results.push(`Auto-joined ${recurringJoins} recurring subscribers`);
  }

  // 7. Availability match notifications (with AvailabilityMatch records)
  const activeWindows = await prisma.availabilityWindow.findMany({
    where: { active: true },
    include: {
      user: { include: { profile: true } },
    },
  });

  // Build matchmaking contexts per user (deduplicated)
  const contextCache = new Map<string, Awaited<ReturnType<typeof buildMatchmakingContext>>>();
  const dateTo7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let availabilityNotifs = 0;
  for (const window of activeWindows) {
    if (!window.user.profile) continue;
    if (!window.user.profile.lat || !window.user.profile.lng) continue;

    // Find OPEN/PENDING_FILL slots matching this window
    const matchingSlots = await prisma.slot.findMany({
      where: {
        status: { in: ["OPEN", "PENDING_FILL"] },
        startTime: { gt: now },
        skillLevel: window.user.profile.skillLevel,
        ageBracket: window.user.profile.ageBracket,
        participants: {
          none: { userId: window.userId },
        },
      },
      include: {
        club: true,
        participants: { where: { status: "JOINED" }, select: { userId: true } },
      },
    });

    for (const slot of matchingSlots) {
      // Check day of week and hour match
      if (slot.startTime.getDay() !== window.dayOfWeek) continue;
      const slotHour = slot.startTime.getHours();
      if (slotHour < window.startHour || slotHour >= window.endHour) continue;

      // Check capacity
      if (slot.participants.length >= slot.requiredPlayers) continue;

      // Check distance
      const dist = distanceMiles(
        window.user.profile.lat!,
        window.user.profile.lng!,
        slot.club.lat,
        slot.club.lng
      );
      if (dist > window.user.profile.radiusMiles) continue;

      // Dedup via AvailabilityMatch unique constraint
      const existingMatch = await prisma.availabilityMatch.findUnique({
        where: { userId_slotId: { userId: window.userId, slotId: slot.id } },
      });
      if (existingMatch) continue;

      // Build context for scoring (cached per user)
      if (!contextCache.has(window.userId)) {
        contextCache.set(
          window.userId,
          await buildMatchmakingContext(window.userId, {
            skillLevel: window.user.profile.skillLevel,
            ageBracket: window.user.profile.ageBracket,
            lat: window.user.profile.lat!,
            lng: window.user.profile.lng!,
            radiusMiles: window.user.profile.radiusMiles,
          })
        );
      }
      const ctx = contextCache.get(window.userId)!;

      // Batch-fetch participant avg ratings
      const participantUserIds = slot.participants.map((p) => p.userId);
      const participantAvgRatings = new Map<string, number>();
      if (participantUserIds.length > 0) {
        const ratings = await prisma.rating.groupBy({
          by: ["rateeId"],
          where: { rateeId: { in: participantUserIds } },
          _avg: { stars: true },
        });
        for (const r of ratings) {
          if (r._avg.stars !== null) {
            participantAvgRatings.set(r.rateeId, r._avg.stars);
          }
        }
      }

      const scoreResult = scoreSlot(
        slot,
        participantUserIds,
        participantAvgRatings,
        ctx,
        now,
        dateTo7d,
        window.user.profile.radiusMiles
      );

      const qualityScore = scoreResult ? scoreResult.score : 0;

      // Create AvailabilityMatch record
      await prisma.availabilityMatch.create({
        data: {
          userId: window.userId,
          slotId: slot.id,
          windowId: window.id,
          qualityScore,
        },
      });

      const name = window.user.profile.name || window.user.name || "Player";
      const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
      const bookUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/dashboard/availability/matches`;

      await prisma.notification.create({
        data: {
          userId: window.userId,
          type: "AVAILABILITY_MATCH",
          title: "Game matches your availability!",
          body: `${slot.club.name} on ${dateStr} (slot:${slot.id})`,
        },
      });

      if (await shouldSendEmail(window.userId, "availabilityMatches")) {
        await sendEmail({
          to: window.user.email,
          subject: "A game matches your availability!",
          html: availabilityMatchEmailHtml({ firstName: name, clubName: slot.club.name, dateStr, bookUrl }),
          text: availabilityMatchEmailText({ firstName: name, clubName: slot.club.name, dateStr, bookUrl }),
        });
      }

      sendPushToUser(window.userId, {
        title: "Game matches your availability!",
        body: `${slot.club.name} on ${dateStr}`,
        url: `/dashboard/availability/matches`,
      }).catch(() => {});

      availabilityNotifs++;
    }
  }
  if (availabilityNotifs > 0) {
    results.push(`Sent ${availabilityNotifs} availability match notifications`);
  }

  // 8. Expire old availability matches (slot has already started)
  const expiredMatches = await prisma.availabilityMatch.updateMany({
    where: {
      status: "PENDING",
      slot: { startTime: { lt: now } },
    },
    data: { status: "EXPIRED" },
  });
  if (expiredMatches.count > 0) {
    results.push(`Expired ${expiredMatches.count} availability matches`);
  }

  return NextResponse.json({
    ran: new Date().toISOString(),
    results,
  });
}

// Allow GET for easy browser/cron testing
export async function GET() {
  return POST();
}
