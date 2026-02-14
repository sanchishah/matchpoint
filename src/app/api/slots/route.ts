import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { distanceMiles } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = req.nextUrl;

  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
  const radius = searchParams.get("radius") ? parseInt(searchParams.get("radius")!) : 10;
  const date = searchParams.get("date");
  const skillLevel = searchParams.get("skillLevel") ? parseInt(searchParams.get("skillLevel")!) : null;
  const ageBracket = searchParams.get("ageBracket") || null;
  const clubId = searchParams.get("clubId") || null;

  const where: Record<string, unknown> = {
    status: { in: ["OPEN", "PENDING_FILL"] },
    startTime: { gt: new Date() },
  };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startTime = { gte: start, lt: end };
  }

  if (skillLevel) where.skillLevel = skillLevel;
  if (ageBracket) where.ageBracket = ageBracket;
  if (clubId) where.clubId = clubId;

  const slots = await prisma.slot.findMany({
    where: where as any,
    include: {
      club: true,
      participants: {
        where: { status: { in: ["JOINED", "WAITLISTED"] } },
        select: { userId: true, status: true },
      },
    },
    orderBy: { startTime: "asc" },
    take: 50,
  });

  // Filter by distance if lat/lng provided
  let filtered = slots;
  if (lat !== null && lng !== null) {
    filtered = slots.filter((slot) => {
      const dist = distanceMiles(lat, lng, slot.club.lat, slot.club.lng);
      return dist <= radius;
    });
  }

  const result = filtered.map((slot) => {
    const joinedCount = slot.participants.filter((p) => p.status === "JOINED").length;
    const waitlistedCount = slot.participants.filter((p) => p.status === "WAITLISTED").length;
    const userJoined = session?.user?.id
      ? slot.participants.some((p) => p.userId === session.user.id && p.status === "JOINED")
      : false;
    const userWaitlisted = session?.user?.id
      ? slot.participants.some((p) => p.userId === session.user.id && p.status === "WAITLISTED")
      : false;

    return {
      id: slot.id,
      club: {
        id: slot.club.id,
        name: slot.club.name,
        address: slot.club.address,
        city: slot.club.city,
        lat: slot.club.lat,
        lng: slot.club.lng,
      },
      startTime: slot.startTime,
      durationMins: slot.durationMins,
      format: slot.format,
      requiredPlayers: slot.requiredPlayers,
      totalCostCents: slot.totalCostCents,
      perPersonCents: Math.round(slot.totalCostCents / slot.requiredPlayers),
      skillLevel: slot.skillLevel,
      ageBracket: slot.ageBracket,
      status: slot.status,
      lockTime: slot.lockTime,
      notes: slot.notes,
      joinedCount,
      waitlistedCount,
      spotsLeft: slot.requiredPlayers - joinedCount,
      userJoined,
      userWaitlisted,
    };
  });

  return NextResponse.json(result);
}
