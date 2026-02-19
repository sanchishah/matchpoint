import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";
import { parseGameIdFromChannel } from "@/lib/chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.text();
  const params = new URLSearchParams(formData);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const gameId = parseGameIdFromChannel(channelName);
  if (!gameId) {
    return NextResponse.json({ error: "Invalid channel format" }, { status: 400 });
  }

  // Check participant or admin
  const [participant, user] = await Promise.all([
    prisma.gameParticipant.findUnique({
      where: { gameId_userId: { gameId, userId: session.user.id } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  if (!participant && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
  });

  return NextResponse.json(authResponse);
}
