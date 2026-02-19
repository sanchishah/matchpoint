import { prisma } from "@/lib/db";

const CHAT_OPEN_BEFORE_START_MS = 30 * 60 * 1000; // 30 minutes
const CHAT_CLOSE_AFTER_END_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getGameOrThrow(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      slot: { include: { club: true } },
      participants: true,
    },
  });
  if (!game) throw { status: 404, message: "Game not found" };
  return game;
}

export function isParticipant(
  game: { participants: { userId: string }[] },
  userId: string
): boolean {
  return game.participants.some((p) => p.userId === userId);
}

export async function requireGameChatAccess(
  gameId: string,
  userId: string,
  role?: string
) {
  const game = await getGameOrThrow(gameId);
  const participant = isParticipant(game, userId);
  const isAdmin = role === "ADMIN";

  if (!participant && !isAdmin) {
    throw { status: 403, message: "Access denied" };
  }

  return { game, isParticipant: participant, isAdmin };
}

export function canWriteChat(
  game: { startTime: Date; endTime: Date; status: string },
  now: Date = new Date()
): { ok: boolean; openAt: Date; closeAt: Date; reason?: string } {
  const openAt = new Date(game.startTime.getTime() - CHAT_OPEN_BEFORE_START_MS);
  const closeAt = new Date(game.endTime.getTime() + CHAT_CLOSE_AFTER_END_MS);

  if (game.status !== "CONFIRMED") {
    return { ok: false, openAt, closeAt, reason: `Chat unavailable for ${game.status} games` };
  }
  if (now < openAt) {
    return { ok: false, openAt, closeAt, reason: "Chat opens 30 minutes before game start" };
  }
  if (now > closeAt) {
    return { ok: false, openAt, closeAt, reason: "Chat closed 2 hours after game end" };
  }
  return { ok: true, openAt, closeAt };
}
