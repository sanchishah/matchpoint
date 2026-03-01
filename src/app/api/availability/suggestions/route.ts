import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { distanceMiles } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.lat || !profile?.lng) {
    return NextResponse.json([]);
  }

  // Analyze last 90 days of open/confirmed slots in user's area
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const recentSlots = await prisma.slot.findMany({
    where: {
      startTime: { gte: ninetyDaysAgo },
      skillLevel: profile.skillLevel,
      ageBracket: profile.ageBracket,
      status: { in: ["OPEN", "PENDING_FILL", "CONFIRMED", "COMPLETED"] },
    },
    include: { club: true },
  });

  // Filter by distance and group by dayOfWeek + hour
  const buckets = new Map<string, { dayOfWeek: number; hour: number; count: number }>();

  for (const slot of recentSlots) {
    const dist = distanceMiles(profile.lat, profile.lng, slot.club.lat, slot.club.lng);
    if (dist > profile.radiusMiles) continue;

    const dayOfWeek = slot.startTime.getDay();
    const hour = slot.startTime.getHours();
    const key = `${dayOfWeek}-${hour}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      buckets.set(key, { dayOfWeek, hour, count: 1 });
    }
  }

  // Get existing windows to exclude
  const existingWindows = await prisma.availabilityWindow.findMany({
    where: { userId: session.user.id, active: true },
  });

  const existingSet = new Set(
    existingWindows.map((w) => `${w.dayOfWeek}-${w.startHour}`)
  );

  // Sort by count desc and return top 5 that don't overlap existing windows
  const suggestions = [...buckets.values()]
    .filter((b) => !existingSet.has(`${b.dayOfWeek}-${b.hour}`))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((b) => ({
      dayOfWeek: b.dayOfWeek,
      startHour: b.hour,
      endHour: Math.min(b.hour + 2, 23),
      gameDensity: b.count,
    }));

  return NextResponse.json(suggestions);
}
