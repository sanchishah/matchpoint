import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const status = req.nextUrl.searchParams.get("status") || "accepted";

  if (status === "pending") {
    const received = await prisma.friendship.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      include: {
        requester: {
          select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sent = await prisma.friendship.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: {
        addressee: {
          select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      received: received.map((f) => ({
        id: f.id,
        friend: {
          id: f.requester.id,
          name: f.requester.profile?.name || f.requester.name,
          skillLevel: f.requester.profile?.skillLevel ?? null,
        },
        status: f.status,
        createdAt: f.createdAt,
      })),
      sent: sent.map((f) => ({
        id: f.id,
        friend: {
          id: f.addressee.id,
          name: f.addressee.profile?.name || f.addressee.name,
          skillLevel: f.addressee.profile?.skillLevel ?? null,
        },
        status: f.status,
        createdAt: f.createdAt,
      })),
    });
  }

  // Default: accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: {
        select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
      },
      addressee: {
        select: { id: true, name: true, profile: { select: { name: true, skillLevel: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friends = friendships.map((f) => {
    const other = f.requesterId === userId ? f.addressee : f.requester;
    return {
      id: f.id,
      friend: {
        id: other.id,
        name: other.profile?.name || other.name,
        skillLevel: other.profile?.skillLevel ?? null,
      },
      status: f.status,
      createdAt: f.createdAt,
    };
  });

  return NextResponse.json(friends);
}
