import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Check game exists and user is participant
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { participants: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isAdmin = user?.role === "ADMIN";

  if (!isParticipant && !isAdmin) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Enforce chat window: 15 min before start to end time
  const now = new Date();
  const chatOpenTime = new Date(game.startTime);
  chatOpenTime.setMinutes(chatOpenTime.getMinutes() - 15);

  if (now < chatOpenTime || now > game.endTime) {
    return NextResponse.json(
      { error: "Chat is not open. It opens 15 minutes before the game and closes at game end." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      gameId,
      userId: session.user.id,
      body: parsed.data.body,
    },
    include: {
      user: {
        select: { id: true, name: true, profile: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(message);
}
