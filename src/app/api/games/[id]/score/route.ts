import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { gameScoreSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const score = await prisma.gameScore.findUnique({
    where: { gameId: id },
  });

  if (!score) {
    return NextResponse.json(null);
  }

  return NextResponse.json(score);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify game exists and is completed
  const game = await prisma.game.findUnique({
    where: { id },
    include: { participants: { select: { userId: true } } },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only submit scores for completed games" }, { status: 400 });
  }

  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Only participants can submit scores" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = gameScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const score = await prisma.gameScore.upsert({
    where: { gameId: id },
    create: {
      gameId: id,
      team1Score: parsed.data.team1Score,
      team2Score: parsed.data.team2Score,
      submittedById: session.user.id,
    },
    update: {
      team1Score: parsed.data.team1Score,
      team2Score: parsed.data.team2Score,
      submittedById: session.user.id,
    },
  });

  return NextResponse.json(score);
}
