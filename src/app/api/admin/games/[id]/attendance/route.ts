import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: gameId } = await params;
  const { attendances } = await req.json();
  // attendances: [{ userId, present }]

  for (const att of attendances) {
    await prisma.attendance.upsert({
      where: { gameId_userId: { gameId, userId: att.userId } },
      update: { present: att.present, markedByUserId: adminSession.user.id },
      create: {
        gameId,
        userId: att.userId,
        present: att.present,
        markedByUserId: adminSession.user.id,
      },
    });

    // If no-show, add strike
    if (!att.present) {
      const existingStrike = await prisma.strike.findFirst({
        where: { userId: att.userId, gameId },
      });
      if (!existingStrike) {
        await prisma.strike.create({
          data: {
            userId: att.userId,
            gameId,
            reason: "No-show",
          },
        });

        // Check if user now has 3+ strikes
        const strikeCount = await prisma.strike.count({ where: { userId: att.userId } });
        if (strikeCount >= 3) {
          await prisma.user.update({
            where: { id: att.userId },
            data: { status: "RESTRICTED" },
          });
        }

        await prisma.notification.create({
          data: {
            userId: att.userId,
            type: "STRIKE_ADDED",
            title: "No-Show Strike",
            body: "You received a no-show strike. 3 strikes will restrict your account.",
          },
        });
      }
    }
  }

  // Mark game as completed
  await prisma.game.update({
    where: { id: gameId },
    data: { status: "COMPLETED" },
  });

  await prisma.slot.update({
    where: { id: (await prisma.game.findUnique({ where: { id: gameId } }))!.slotId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ success: true });
}
