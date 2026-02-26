import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      slot: { include: { club: true } },
      participants: { select: { userId: true } },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const formatLabel = game.slot.format === "SINGLES" ? "Singles" : "Doubles";
  const summary = `Matchpoint ${formatLabel} — ${game.slot.club.name}`;
  const location = `${game.slot.club.address}, ${game.slot.club.city}`;
  const description = `${formatLabel} game at ${game.slot.club.name}. Skill level ${game.slot.skillLevel}.`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Matchpoint//Game//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${game.id}@mymatchpoint.com`,
    `DTSTART:${formatICSDate(game.startTime)}`,
    `DTEND:${formatICSDate(game.endTime)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="matchpoint-game-${game.id}.ics"`,
    },
  });
}
