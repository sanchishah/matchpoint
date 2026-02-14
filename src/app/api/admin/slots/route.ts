import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slotSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const slots = await prisma.slot.findMany({
    orderBy: { startTime: "desc" },
    include: {
      club: { select: { name: true, city: true } },
      participants: { select: { userId: true, status: true } },
      game: { select: { id: true, status: true } },
    },
    take: 100,
  });
  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const startTime = new Date(parsed.data.startTime);
  const lockTime = new Date(startTime);
  lockTime.setHours(lockTime.getHours() - 8);

  const requiredPlayers = parsed.data.format === "SINGLES" ? 2 : 4;

  const slot = await prisma.slot.create({
    data: {
      clubId: parsed.data.clubId,
      startTime,
      durationMins: parsed.data.durationMins,
      format: parsed.data.format,
      requiredPlayers,
      totalCostCents: parsed.data.totalCostCents,
      skillLevel: parsed.data.skillLevel,
      ageBracket: parsed.data.ageBracket,
      lockTime,
      notes: parsed.data.notes,
    },
  });
  return NextResponse.json(slot);
}
