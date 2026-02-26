import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { friendResponseSchema } from "@/lib/validations";
import { sendEmail, shouldSendEmail } from "@/lib/email";
import { friendAcceptedEmailHtml, friendAcceptedEmailText } from "@/lib/emails/friend-request";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = friendResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) {
    return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
  }

  if (friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "Only the recipient can respond" }, { status: 403 });
  }

  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been handled" }, { status: 400 });
  }

  const newStatus = parsed.data.action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: newStatus },
  });

  if (newStatus === "ACCEPTED") {
    const accepter = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });
    const requester = await prisma.user.findUnique({
      where: { id: friendship.requesterId },
      include: { profile: true },
    });

    if (accepter && requester) {
      const accepterName = accepter.profile?.name || accepter.name || "A player";
      const requesterFirstName = (requester.profile?.name || requester.name || "Player").split(" ")[0];

      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          type: "FRIEND_REQUEST_ACCEPTED",
          title: "Friend Request Accepted",
          body: `${accepterName} accepted your friend request.`,
        },
      });

      if (await shouldSendEmail(friendship.requesterId, "friendRequests")) {
        sendEmail({
          to: requester.email,
          subject: `${accepterName} accepted your friend request`,
          html: friendAcceptedEmailHtml(requesterFirstName, accepterName),
          text: friendAcceptedEmailText(requesterFirstName, accepterName),
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json(updated);
}
