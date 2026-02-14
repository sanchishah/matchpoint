import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ratingSchema } from "@/lib/validations";

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
  const parsed = ratingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Check game exists and is completed or past end time
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { participants: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Only allow rating after game end time
  if (new Date() < game.endTime) {
    return NextResponse.json(
      { error: "You can only rate after the game ends" },
      { status: 400 }
    );
  }

  // Check rater is a participant
  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Only participants can rate" }, { status: 403 });
  }

  // Check ratee is a participant
  const rateeIsParticipant = game.participants.some((p) => p.userId === parsed.data.rateeId);
  if (!rateeIsParticipant) {
    return NextResponse.json({ error: "Can only rate other participants" }, { status: 400 });
  }

  // Can't rate yourself
  if (parsed.data.rateeId === session.user.id) {
    return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
  }

  // Upsert rating
  const rating = await prisma.rating.upsert({
    where: {
      gameId_raterId_rateeId: {
        gameId,
        raterId: session.user.id,
        rateeId: parsed.data.rateeId,
      },
    },
    update: {
      stars: parsed.data.stars,
      feltLevel: parsed.data.feltLevel,
      comment: parsed.data.comment,
    },
    create: {
      gameId,
      raterId: session.user.id,
      rateeId: parsed.data.rateeId,
      stars: parsed.data.stars,
      feltLevel: parsed.data.feltLevel,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json(rating);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;

  const ratings = await prisma.rating.findMany({
    where: { gameId },
    include: {
      rater: { select: { id: true, name: true, profile: { select: { name: true } } } },
      ratee: { select: { id: true, name: true, profile: { select: { name: true } } } },
    },
  });

  return NextResponse.json(ratings);
}
