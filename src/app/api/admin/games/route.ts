import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const games = await prisma.game.findMany({
    orderBy: { startTime: "desc" },
    include: {
      slot: { include: { club: { select: { name: true, city: true } } } },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true, profile: { select: { name: true } } },
          },
        },
      },
      payments: true,
      attendances: true,
    },
    take: 100,
  });

  return NextResponse.json(games);
}
