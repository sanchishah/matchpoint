import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { confirmGame } from "@/lib/game-service";
import { sendEmail, spotReservedEmail, shouldSendEmail } from "@/lib/email";
import { format } from "date-fns";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: matchId } = await params;
  const userId = session.user.id;

  // Get the match
  const match = await prisma.availabilityMatch.findUnique({
    where: { id: matchId },
    include: {
      slot: {
        include: {
          club: true,
          participants: {
            where: { status: { in: ["JOINED", "WAITLISTED"] } },
          },
        },
      },
    },
  });

  if (!match || match.userId !== userId) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status !== "PENDING") {
    return NextResponse.json(
      { error: "This match is no longer pending" },
      { status: 400 }
    );
  }

  const slot = match.slot;

  // Validate slot is still available
  if (!["OPEN", "PENDING_FILL"].includes(slot.status)) {
    await prisma.availabilityMatch.update({
      where: { id: matchId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "This slot is no longer available" },
      { status: 400 }
    );
  }

  // Check profile + matching rules
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json(
      { error: "Please complete your profile first" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.status === "RESTRICTED") {
    return NextResponse.json(
      { error: "Your account is restricted" },
      { status: 403 }
    );
  }

  if (!user?.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email first" },
      { status: 403 }
    );
  }

  const strikeCount = await prisma.strike.count({ where: { userId } });
  if (strikeCount >= 3) {
    return NextResponse.json(
      { error: "Too many no-show strikes" },
      { status: 403 }
    );
  }

  if (profile.skillLevel !== slot.skillLevel) {
    return NextResponse.json(
      { error: `Skill level mismatch` },
      { status: 400 }
    );
  }

  if (profile.ageBracket !== slot.ageBracket) {
    return NextResponse.json(
      { error: "Age bracket mismatch" },
      { status: 400 }
    );
  }

  // Check if already participating
  const existing = await prisma.slotParticipant.findUnique({
    where: { slotId_userId: { slotId: slot.id, userId } },
  });

  if (existing && ["JOINED", "WAITLISTED"].includes(existing.status)) {
    // Already joined — just update match status
    await prisma.availabilityMatch.update({
      where: { id: matchId },
      data: { status: "JOINED", joinedAt: new Date() },
    });
    return NextResponse.json({
      status: "JOINED",
      message: "You've already reserved this slot.",
    });
  }

  // Join the slot
  const joinedCount = slot.participants.filter(
    (p) => p.status === "JOINED"
  ).length;
  const isFull = joinedCount >= slot.requiredPlayers;

  if (existing) {
    await prisma.slotParticipant.update({
      where: { id: existing.id },
      data: {
        status: isFull ? "WAITLISTED" : "JOINED",
        joinedAt: new Date(),
      },
    });
  } else {
    await prisma.slotParticipant.create({
      data: {
        slotId: slot.id,
        userId,
        status: isFull ? "WAITLISTED" : "JOINED",
      },
    });
  }

  if (slot.status === "OPEN" && !isFull) {
    await prisma.slot.update({
      where: { id: slot.id },
      data: { status: "PENDING_FILL" },
    });
  }

  // Update match status
  await prisma.availabilityMatch.update({
    where: { id: matchId },
    data: { status: "JOINED", joinedAt: new Date() },
  });

  // Send email
  const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
  if (await shouldSendEmail(userId, "gameConfirmations")) {
    const emailData = spotReservedEmail(profile.name, slot.club.name, dateStr);
    sendEmail({ to: user!.email, ...emailData });
  }

  // Notification
  await prisma.notification.create({
    data: {
      userId,
      type: isFull ? "WAITLISTED" : "SPOT_RESERVED",
      title: isFull ? "Added to Waitlist" : "Spot Reserved",
      body: isFull
        ? `You're on the waitlist for ${slot.club.name} on ${dateStr}.`
        : `You've reserved a spot at ${slot.club.name} on ${dateStr}.`,
    },
  });

  // Check if game should confirm
  if (!isFull && joinedCount + 1 >= slot.requiredPlayers) {
    try {
      await confirmGame(slot.id);
      return NextResponse.json({
        status: "CONFIRMED",
        message: "Game confirmed! Payment has been charged.",
      });
    } catch {
      // Confirmation failed silently
    }
  }

  return NextResponse.json({
    status: isFull ? "WAITLISTED" : "JOINED",
    message: isFull
      ? "You've been added to the waitlist."
      : "Spot reserved! Waiting for more players.",
  });
}
