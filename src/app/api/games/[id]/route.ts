import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      slot: { include: { club: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { name: true, skillLevel: true, ageBracket: true, gender: true } },
            },
          },
        },
      },
      payments: {
        where: { userId: session.user.id },
        select: { amountCents: true, status: true },
      },
      ratings: {
        where: { raterId: session.user.id },
        select: { rateeId: true, stars: true, feltLevel: true },
      },
      messages: {
        include: {
          user: {
            select: { id: true, name: true, profile: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Check if user is participant or admin
  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isAdmin = user?.role === "ADMIN";

  if (!isParticipant && !isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const now = new Date();
  const chatOpenTime = new Date(game.startTime);
  chatOpenTime.setMinutes(chatOpenTime.getMinutes() - 15);
  const chatOpen = now >= chatOpenTime && now <= game.endTime;

  return NextResponse.json({
    ...game,
    chatOpen,
    chatOpenTime,
    isParticipant,
    isAdmin,
  });
}
