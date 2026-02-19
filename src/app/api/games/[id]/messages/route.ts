import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { requireGameChatAccess, canWriteChat } from "@/lib/chat";
import { checkRateLimit, CHAT_BURST, CHAT_SUSTAINED } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    await requireGameChatAccess(gameId, session.user.id, user?.role ?? undefined);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: e.status || 500 }
    );
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const messages = await prisma.message.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    include: {
      user: {
        select: { id: true, name: true, profile: { select: { name: true } } },
      },
    },
  });

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

  return NextResponse.json({ items: messages, nextCursor });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let game;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const result = await requireGameChatAccess(gameId, session.user.id, user?.role ?? undefined);
    game = result.game;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: e.status || 500 }
    );
  }

  // Enforce chat window
  const chatCheck = canWriteChat(game);
  if (!chatCheck.ok) {
    return NextResponse.json({ error: chatCheck.reason }, { status: 400 });
  }

  // Rate limiting
  const burstKey = `chatBurst:${session.user.id}:${gameId}`;
  const sustainedKey = `chatSustained:${session.user.id}:${gameId}`;

  const burstCheck = checkRateLimit(burstKey, CHAT_BURST);
  if (!burstCheck.allowed) {
    return NextResponse.json(
      { error: "Too many messages, slow down" },
      { status: 429 }
    );
  }

  const sustainedCheck = checkRateLimit(sustainedKey, CHAT_SUSTAINED);
  if (!sustainedCheck.allowed) {
    return NextResponse.json(
      { error: "Message rate limit exceeded, try again later" },
      { status: 429 }
    );
  }

  const message = await prisma.message.create({
    data: {
      gameId,
      userId: session.user.id,
      body: parsed.data.body,
    },
    include: {
      user: {
        select: { id: true, name: true, profile: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(message);
}
