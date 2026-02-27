import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, reminderEmail, chatOpenEmail, shouldSendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { confirmGame } from "@/lib/game-service";
import { distanceMiles } from "@/lib/constants";
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

  // 7. Availability match notifications
  const activeWindows = await prisma.availabilityWindow.findMany({
    where: { active: true },
    include: {
      user: { include: { profile: true } },
    },
  });

  let availabilityNotifs = 0;
  for (const window of activeWindows) {
    if (!window.user.profile) continue;

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
        participants: { where: { status: "JOINED" }, select: { id: true } },
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
      if (window.user.profile.lat && window.user.profile.lng) {
        const dist = distanceMiles(
          window.user.profile.lat,
          window.user.profile.lng,
          slot.club.lat,
          slot.club.lng
        );
        if (dist > window.user.profile.radiusMiles) continue;
      }

      // Check not already notified for this slot
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: window.userId,
          type: "AVAILABILITY_MATCH",
          body: { contains: slot.id },
        },
      });
      if (alreadyNotified) continue;

      const name = window.user.profile.name || window.user.name || "Player";
      const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
      const bookUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/book?slot=${slot.id}`;

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
        url: `/book?slot=${slot.id}`,
      }).catch(() => {});

      availabilityNotifs++;
    }
  }
  if (availabilityNotifs > 0) {
    results.push(`Sent ${availabilityNotifs} availability match notifications`);
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
