import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { confirmGame } from "@/lib/game-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const userId = session.user.id;

  // Verify groupId exists
  const seriesSlots = await prisma.slot.findMany({
    where: { recurringGroupId: groupId },
    orderBy: { startTime: "asc" },
  });

  if (seriesSlots.length === 0) {
    return NextResponse.json({ error: "Recurring series not found" }, { status: 404 });
  }

  // Check user profile matches slot requirements
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!profile?.profile) {
    return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
  }

  const refSlot = seriesSlots[0];
  if (profile.profile.skillLevel !== refSlot.skillLevel) {
    return NextResponse.json({ error: "Your skill level does not match this series" }, { status: 400 });
  }
  if (profile.profile.ageBracket !== refSlot.ageBracket) {
    return NextResponse.json({ error: "Your age bracket does not match this series" }, { status: 400 });
  }

  // Create or reactivate subscription
  const existing = await prisma.recurringSubscription.findUnique({
    where: { userId_recurringGroupId: { userId, recurringGroupId: groupId } },
  });

  let subscription;
  if (existing) {
    subscription = await prisma.recurringSubscription.update({
      where: { id: existing.id },
      data: { active: true },
    });
  } else {
    subscription = await prisma.recurringSubscription.create({
      data: { userId, recurringGroupId: groupId },
    });
  }

  // Auto-join user to all future OPEN/PENDING_FILL slots in the series
  const futureSlots = seriesSlots.filter(
    (s) =>
      (s.status === "OPEN" || s.status === "PENDING_FILL") &&
      s.startTime > new Date()
  );

  let joinedCount = 0;
  for (const slot of futureSlots) {
    // Check if already a participant
    const existingParticipant = await prisma.slotParticipant.findUnique({
      where: { slotId_userId: { slotId: slot.id, userId } },
    });
    if (existingParticipant) continue;

    // Check capacity
    const currentJoined = await prisma.slotParticipant.count({
      where: { slotId: slot.id, status: "JOINED" },
    });

    if (currentJoined < slot.requiredPlayers) {
      await prisma.slotParticipant.create({
        data: { slotId: slot.id, userId, status: "JOINED" },
      });

      // Update slot status if needed
      if (currentJoined === 0) {
        await prisma.slot.update({
          where: { id: slot.id },
          data: { status: "PENDING_FILL" },
        });
      }

      await prisma.notification.create({
        data: {
          userId,
          type: "RECURRING_AUTO_JOIN",
          title: "Auto-joined to game",
          body: `You've been auto-joined to a recurring game slot.`,
        },
      });

      // Check if game should confirm
      if (currentJoined + 1 >= slot.requiredPlayers) {
        confirmGame(slot.id).catch(() => {});
      }

      joinedCount++;
    }
  }

  return NextResponse.json({ subscription, joinedSlots: joinedCount }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const userId = session.user.id;

  const subscription = await prisma.recurringSubscription.findUnique({
    where: { userId_recurringGroupId: { userId, recurringGroupId: groupId } },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  await prisma.recurringSubscription.update({
    where: { id: subscription.id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
