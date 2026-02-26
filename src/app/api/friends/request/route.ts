import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { friendRequestSchema } from "@/lib/validations";
import { sendEmail, shouldSendEmail } from "@/lib/email";
import { friendRequestEmailHtml, friendRequestEmailText } from "@/lib/emails/friend-request";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = friendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { addresseeId } = parsed.data;
  const requesterId = session.user.id;

  if (requesterId === addresseeId) {
    return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
  }

  // Verify they've played in the same game
  const sharedGame = await prisma.gameParticipant.findFirst({
    where: {
      userId: requesterId,
      game: {
        participants: {
          some: { userId: addresseeId },
        },
      },
    },
  });

  if (!sharedGame) {
    return NextResponse.json({ error: "You can only add friends you've played with" }, { status: 400 });
  }

  // Check for existing friendship (in either direction)
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "You are already friends" }, { status: 400 });
    }
    if (existing.status === "PENDING") {
      return NextResponse.json({ error: "A friend request is already pending" }, { status: 400 });
    }
    // REJECTED — update back to PENDING
    if (existing.status === "REJECTED") {
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId, addresseeId, status: "PENDING" },
      });

      // Notification + email
      await createFriendRequestNotification(requesterId, addresseeId);

      return NextResponse.json(updated);
    }
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId, addresseeId },
  });

  await createFriendRequestNotification(requesterId, addresseeId);

  return NextResponse.json(friendship, { status: 201 });
}

async function createFriendRequestNotification(requesterId: string, addresseeId: string) {
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: { profile: true },
  });

  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    include: { profile: true },
  });

  if (!requester || !addressee) return;

  const senderName = requester.profile?.name || requester.name || "A player";
  const recipientFirstName = (addressee.profile?.name || addressee.name || "Player").split(" ")[0];

  await prisma.notification.create({
    data: {
      userId: addresseeId,
      type: "FRIEND_REQUEST_RECEIVED",
      title: "New Friend Request",
      body: `${senderName} sent you a friend request.`,
    },
  });

  if (await shouldSendEmail(addresseeId, "friendRequests")) {
    sendEmail({
      to: addressee.email,
      subject: `${senderName} wants to be your friend on Matchpoint`,
      html: friendRequestEmailHtml(recipientFirstName, senderName),
      text: friendRequestEmailText(recipientFirstName, senderName),
    }).catch(() => {});
  }
}
