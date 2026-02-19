import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canWriteChat } from "@/lib/chat";

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
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: { messages: true },
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

  const chatStatus = canWriteChat(game);
  const messagesTruncated = game._count.messages > 50;

  // Reverse messages to asc order for the client
  const messages = [...game.messages].reverse();

  return NextResponse.json({
    ...game,
    messages,
    chatOpen: chatStatus.ok,
    chatOpenTime: chatStatus.openAt,
    chatCloseTime: chatStatus.closeAt,
    messagesTruncated,
    isParticipant,
    isAdmin,
  });
}
