import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favoriteClub.findMany({
    where: { userId: session.user.id },
    include: { club: true },
  });

  return NextResponse.json(favorites.map((f) => f.club));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clubId } = await req.json();
  if (!clubId) {
    return NextResponse.json({ error: "clubId required" }, { status: 400 });
  }

  const existing = await prisma.favoriteClub.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  });

  if (existing) {
    await prisma.favoriteClub.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.favoriteClub.create({
      data: { userId: session.user.id, clubId },
    });
    return NextResponse.json({ favorited: true });
  }
}
