import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) {
    where.status = status;
  }

  const payments = await prisma.payment.findMany({
    where: where as any,
    include: {
      game: {
        include: {
          slot: {
            include: {
              club: { select: { id: true, name: true, city: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = payments.map((p) => ({
    id: p.id,
    amountCents: p.amountCents,
    status: p.status,
    createdAt: p.createdAt,
    game: {
      id: p.game.id,
      startTime: p.game.startTime,
      format: p.game.slot.format,
      club: p.game.slot.club,
    },
  }));

  return NextResponse.json(result);
}
