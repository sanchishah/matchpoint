import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { distanceMiles } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = req.nextUrl;

  let lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
  let lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
  const radius = searchParams.get("radius") ? parseInt(searchParams.get("radius")!) : 10;
  const zip = searchParams.get("zip");

  // Geocode zip code to lat/lng if zip is provided but coordinates aren't
  if (zip && lat === null && lng === null) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const place = geoData?.places?.[0];
        if (place) {
          lat = parseFloat(place.latitude);
          lng = parseFloat(place.longitude);
        }
      }
    } catch {
      // Continue without distance filtering if geocoding fails
    }
  }
  const date = searchParams.get("date");
  const skillLevelRaw = searchParams.get("skillLevel");
  const skillLevel = skillLevelRaw && skillLevelRaw !== "all" ? parseInt(skillLevelRaw) : null;
  const ageBracketRaw = searchParams.get("ageBracket");
  const ageBracket = ageBracketRaw && ageBracketRaw !== "all" ? ageBracketRaw : null;
  const clubId = searchParams.get("clubId") || null;
  const formatFilter = searchParams.get("format") || null;
  const dayOfWeekRaw = searchParams.get("dayOfWeek");
  const dayOfWeek = dayOfWeekRaw !== null && dayOfWeekRaw !== "" ? parseInt(dayOfWeekRaw) : null;
  const timeOfDay = searchParams.get("timeOfDay") || null;

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
  if (formatFilter) where.format = formatFilter;

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
    filtered = filtered.filter((slot) => {
      const dist = distanceMiles(lat, lng, slot.club.lat, slot.club.lng);
      return dist <= radius;
    });
  }

  // Filter by day of week (0=Sunday, 6=Saturday) — post-query
  if (dayOfWeek !== null && !isNaN(dayOfWeek)) {
    filtered = filtered.filter((slot) => new Date(slot.startTime).getDay() === dayOfWeek);
  }

  // Filter by time of day — post-query
  if (timeOfDay) {
    filtered = filtered.filter((slot) => {
      const hour = new Date(slot.startTime).getHours();
      if (timeOfDay === "morning") return hour >= 6 && hour < 12;
      if (timeOfDay === "afternoon") return hour >= 12 && hour < 17;
      if (timeOfDay === "evening") return hour >= 17 && hour < 22;
      return true;
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

    // Calculate waitlist position
    const waitlisted = slot.participants.filter((p) => p.status === "WAITLISTED");
    const waitlistPosition = session?.user?.id && userWaitlisted
      ? waitlisted.findIndex((p) => p.userId === session.user.id) + 1
      : null;

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
      waitlistPosition,
    };
  });

  return NextResponse.json(result);
}
