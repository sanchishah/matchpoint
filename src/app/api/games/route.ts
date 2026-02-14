import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      slot: { include: { club: true } },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(games);
}
