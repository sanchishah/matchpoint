import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const slot = await prisma.slot.findUnique({
    where: { id },
    include: {
      club: true,
      participants: {
        where: { status: { in: ["JOINED", "WAITLISTED"] } },
        include: {
          user: {
            select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      game: {
        include: {
          participants: { select: { userId: true } },
        },
      },
    },
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const joinedCount = slot.participants.filter((p) => p.status === "JOINED").length;
  const userJoined = session?.user?.id
    ? slot.participants.some((p) => p.userId === session.user.id && p.status === "JOINED")
    : false;
  const userWaitlisted = session?.user?.id
    ? slot.participants.some((p) => p.userId === session.user.id && p.status === "WAITLISTED")
    : false;

  return NextResponse.json({
    ...slot,
    joinedCount,
    spotsLeft: slot.requiredPlayers - joinedCount,
    userJoined,
    userWaitlisted,
  });
}
