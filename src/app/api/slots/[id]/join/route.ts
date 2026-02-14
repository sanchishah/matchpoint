import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { confirmGame } from "@/lib/game-service";
import { sendEmail, spotReservedEmail } from "@/lib/email";
import { format } from "date-fns";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slotId } = await params;
  const userId = session.user.id;

  // Check user profile exists
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json(
      { error: "Please complete your profile first" },
      { status: 400 }
    );
  }

  // Check user is not restricted
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.status === "RESTRICTED") {
    return NextResponse.json(
      { error: "Your account is restricted. Contact admin." },
      { status: 403 }
    );
  }

  // Check strikes
  const strikeCount = await prisma.strike.count({ where: { userId } });
  if (strikeCount >= 3) {
    return NextResponse.json(
      { error: "Too many no-show strikes. Contact admin." },
      { status: 403 }
    );
  }

  // Get slot
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      club: true,
      participants: {
        where: { status: { in: ["JOINED", "WAITLISTED"] } },
      },
    },
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (!["OPEN", "PENDING_FILL"].includes(slot.status)) {
    return NextResponse.json(
      { error: "This slot is no longer available" },
      { status: 400 }
    );
  }

  // Enforce matching rules: skill level + age bracket
  if (profile.skillLevel !== slot.skillLevel) {
    return NextResponse.json(
      { error: `This slot requires skill level ${slot.skillLevel}. Your level is ${profile.skillLevel}.` },
      { status: 400 }
    );
  }

  if (profile.ageBracket !== slot.ageBracket) {
    return NextResponse.json(
      { error: "This slot is for a different age bracket than yours." },
      { status: 400 }
    );
  }

  // Check if already participating
  const existing = await prisma.slotParticipant.findUnique({
    where: { slotId_userId: { slotId, userId } },
  });

  if (existing && ["JOINED", "WAITLISTED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "You've already reserved this slot" },
      { status: 400 }
    );
  }

  // Count joined
  const joinedCount = slot.participants.filter((p) => p.status === "JOINED").length;
  const isFull = joinedCount >= slot.requiredPlayers;

  if (existing) {
    // Re-join (was cancelled before)
    await prisma.slotParticipant.update({
      where: { id: existing.id },
      data: { status: isFull ? "WAITLISTED" : "JOINED", joinedAt: new Date() },
    });
  } else {
    await prisma.slotParticipant.create({
      data: {
        slotId,
        userId,
        status: isFull ? "WAITLISTED" : "JOINED",
      },
    });
  }

  // Update slot status if first join
  if (slot.status === "OPEN" && !isFull) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { status: "PENDING_FILL" },
    });
  }

  // Send reservation email
  const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
  const emailData = spotReservedEmail(
    profile.name,
    slot.club.name,
    dateStr
  );
  sendEmail({ to: user!.email, ...emailData });

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: isFull ? "WAITLISTED" : "SPOT_RESERVED",
      title: isFull ? "Added to Waitlist" : "Spot Reserved",
      body: isFull
        ? `You're on the waitlist for ${slot.club.name} on ${dateStr}.`
        : `You've reserved a spot at ${slot.club.name} on ${dateStr}. Waiting for more players.`,
    },
  });

  // Check if game should be confirmed
  if (!isFull) {
    const newJoinedCount = joinedCount + 1;
    if (newJoinedCount >= slot.requiredPlayers) {
      try {
        await confirmGame(slotId);
        return NextResponse.json({
          status: "CONFIRMED",
          message: "Game confirmed! Payment has been charged.",
        });
      } catch (error) {
        console.error("Confirmation failed:", error);
      }
    }
  }

  return NextResponse.json({
    status: isFull ? "WAITLISTED" : "JOINED",
    message: isFull
      ? "You've been added to the waitlist."
      : "Spot reserved! Waiting for more players.",
  });
}
