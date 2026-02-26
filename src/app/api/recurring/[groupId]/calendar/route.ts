import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const slots = await prisma.slot.findMany({
    where: { recurringGroupId: groupId },
    include: { club: true },
    orderBy: { startTime: "asc" },
  });

  if (slots.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const events = slots
    .filter((s) => s.status !== "CANCELLED")
    .map((slot) => {
      const endTime = new Date(slot.startTime);
      endTime.setMinutes(endTime.getMinutes() + slot.durationMins);
      const formatLabel = slot.format === "SINGLES" ? "Singles" : "Doubles";
      const summary = `Matchpoint ${formatLabel} — ${slot.club.name}`;
      const location = `${slot.club.address}, ${slot.club.city}`;
      const description = `${formatLabel} game at ${slot.club.name}. Skill level ${slot.skillLevel}.`;

      return [
        "BEGIN:VEVENT",
        `UID:${slot.id}@mymatchpoint.com`,
        `DTSTART:${formatICSDate(slot.startTime)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        `STATUS:${slot.status === "CONFIRMED" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Matchpoint//RecurringSeries//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="matchpoint-series-${groupId}.ics"`,
    },
  });
}
