import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status && ["PENDING", "JOINED", "DISMISSED", "EXPIRED"].includes(status)) {
    where.status = status;
  }

  const matches = await prisma.availabilityMatch.findMany({
    where,
    orderBy: { qualityScore: "desc" },
    include: {
      slot: {
        include: {
          club: true,
          participants: {
            where: { status: "JOINED" },
            select: { userId: true },
          },
        },
      },
      window: {
        select: { dayOfWeek: true, startHour: true, endHour: true },
      },
    },
  });

  const result = matches.map((m) => ({
    id: m.id,
    slotId: m.slotId,
    qualityScore: m.qualityScore,
    status: m.status,
    notifiedAt: m.notifiedAt,
    joinedAt: m.joinedAt,
    dismissedAt: m.dismissedAt,
    slot: {
      id: m.slot.id,
      startTime: m.slot.startTime,
      durationMins: m.slot.durationMins,
      format: m.slot.format,
      requiredPlayers: m.slot.requiredPlayers,
      totalCostCents: m.slot.totalCostCents,
      skillLevel: m.slot.skillLevel,
      ageBracket: m.slot.ageBracket,
      status: m.slot.status,
      joinedCount: m.slot.participants.length,
      spotsLeft: m.slot.requiredPlayers - m.slot.participants.length,
      club: {
        id: m.slot.club.id,
        name: m.slot.club.name,
        address: m.slot.club.address,
        city: m.slot.club.city,
      },
    },
    window: m.window,
  }));

  return NextResponse.json(result);
}
