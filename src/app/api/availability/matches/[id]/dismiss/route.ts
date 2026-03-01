import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: matchId } = await params;

  const match = await prisma.availabilityMatch.findUnique({
    where: { id: matchId },
  });

  if (!match || match.userId !== session.user.id) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status !== "PENDING") {
    return NextResponse.json(
      { error: "This match is no longer pending" },
      { status: 400 }
    );
  }

  await prisma.availabilityMatch.update({
    where: { id: matchId },
    data: { status: "DISMISSED", dismissedAt: new Date() },
  });

  return NextResponse.json({ status: "DISMISSED" });
}
