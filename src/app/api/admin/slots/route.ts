import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slotSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { waitlistNotifyEmailHtml, waitlistNotifyEmailText } from "@/lib/emails/waitlist-notify";
import { distanceMiles } from "@/lib/constants";
import { confirmGame } from "@/lib/game-service";
import { format } from "date-fns";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const slots = await prisma.slot.findMany({
    orderBy: { startTime: "desc" },
    include: {
      club: { select: { name: true, city: true } },
      participants: { select: { userId: true, status: true } },
      game: { select: { id: true, status: true } },
    },
    take: 100,
  });
  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const startTime = new Date(parsed.data.startTime);
  const lockTime = new Date(startTime);
  lockTime.setHours(lockTime.getHours() - 8);

  const requiredPlayers = parsed.data.format === "SINGLES" ? 2 : 4;

  // Handle recurring slots
  const repeatWeeks = body.repeatWeeks ? parseInt(body.repeatWeeks) : 0;

  if (repeatWeeks > 0) {
    const recurringGroupId = randomBytes(8).toString("hex");
    const slots = [];

    for (let i = 0; i < repeatWeeks; i++) {
      const slotStart = new Date(startTime);
      slotStart.setDate(slotStart.getDate() + i * 7);
      const slotLock = new Date(slotStart);
      slotLock.setHours(slotLock.getHours() - 8);

      slots.push({
        clubId: parsed.data.clubId,
        startTime: slotStart,
        durationMins: parsed.data.durationMins,
        format: parsed.data.format as "SINGLES" | "DOUBLES",
        requiredPlayers,
        totalCostCents: parsed.data.totalCostCents,
        skillLevel: parsed.data.skillLevel,
        ageBracket: parsed.data.ageBracket as "AGE_18_24" | "AGE_25_34" | "AGE_35_44" | "AGE_45_54" | "AGE_55_64" | "AGE_65_PLUS",
        lockTime: slotLock,
        notes: parsed.data.notes || null,
        recurringGroupId,
      });
    }

    const result = await prisma.slot.createMany({ data: slots });

    // Auto-join existing subscribers to the new recurring slots
    autoJoinSubscribers(recurringGroupId, parsed.data).catch(() => {});

    return NextResponse.json({ created: result.count, recurringGroupId });
  }

  const slot = await prisma.slot.create({
    data: {
      clubId: parsed.data.clubId,
      startTime,
      durationMins: parsed.data.durationMins,
      format: parsed.data.format,
      requiredPlayers,
      totalCostCents: parsed.data.totalCostCents,
      skillLevel: parsed.data.skillLevel,
      ageBracket: parsed.data.ageBracket,
      lockTime,
      notes: parsed.data.notes,
    },
    include: { club: true },
  });

  // Fire-and-forget: notify matching users about the new slot
  notifyMatchingUsers(slot).catch(() => {});

  return NextResponse.json(slot);
}

async function notifyMatchingUsers(slot: {
  id: string;
  skillLevel: number;
  ageBracket: string;
  startTime: Date;
  club: { name: string; lat: number; lng: number };
}) {
  const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

  // Find users matching skill level and age bracket who have a profile with location
  const matchingProfiles = await prisma.profile.findMany({
    where: {
      skillLevel: slot.skillLevel,
      ageBracket: slot.ageBracket as "AGE_18_24" | "AGE_25_34" | "AGE_35_44" | "AGE_45_54" | "AGE_55_64" | "AGE_65_PLUS",
      lat: { not: null },
      lng: { not: null },
    },
    include: { user: { select: { id: true, email: true, emailVerified: true, status: true } } },
  });

  const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
  const bookUrl = `${APP_BASE_URL}/book`;

  for (const profile of matchingProfiles) {
    // Skip restricted or unverified users
    if (profile.user.status !== "ACTIVE") continue;

    // Check distance
    if (profile.lat && profile.lng) {
      const dist = distanceMiles(profile.lat, profile.lng, slot.club.lat, slot.club.lng);
      if (dist > profile.radiusMiles) continue;
    }

    const firstName = profile.name.split(" ")[0];

    sendEmail({
      to: profile.user.email,
      subject: `New game at ${slot.club.name} — matches your level!`,
      html: waitlistNotifyEmailHtml({ firstName, clubName: slot.club.name, dateStr, bookUrl }),
      text: waitlistNotifyEmailText({ firstName, clubName: slot.club.name, dateStr, bookUrl }),
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId: profile.user.id,
        type: "NEW_SLOT_MATCH",
        title: "New game available!",
        body: `A new game at ${slot.club.name} on ${dateStr} matches your preferences.`,
      },
    });
  }
}

async function autoJoinSubscribers(
  recurringGroupId: string,
  slotData: { skillLevel: number; ageBracket: string }
) {
  // Find active subscriptions for this recurring group
  const subscriptions = await prisma.recurringSubscription.findMany({
    where: { recurringGroupId, active: true },
    include: { user: { include: { profile: true } } },
  });

  if (subscriptions.length === 0) return;

  // Get the newly created future slots
  const futureSlots = await prisma.slot.findMany({
    where: {
      recurringGroupId,
      status: { in: ["OPEN", "PENDING_FILL"] },
      startTime: { gt: new Date() },
    },
    include: {
      participants: { where: { status: "JOINED" }, select: { userId: true } },
    },
  });

  for (const sub of subscriptions) {
    if (!sub.user.profile) continue;
    if (sub.user.profile.skillLevel !== slotData.skillLevel) continue;
    if (sub.user.profile.ageBracket !== slotData.ageBracket) continue;

    for (const slot of futureSlots) {
      // Skip if already a participant
      if (slot.participants.some((p) => p.userId === sub.userId)) continue;

      const joinedCount = slot.participants.length;
      if (joinedCount >= slot.requiredPlayers) continue;

      await prisma.slotParticipant.create({
        data: { slotId: slot.id, userId: sub.userId, status: "JOINED" },
      });

      // Add to in-memory list so subsequent subscribers see updated count
      slot.participants.push({ userId: sub.userId });

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

      if (joinedCount + 1 >= slot.requiredPlayers) {
        confirmGame(slot.id).catch(() => {});
      }
    }
  }
}
