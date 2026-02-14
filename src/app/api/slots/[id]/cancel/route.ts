import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { handleCancellation } from "@/lib/game-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slotId } = await params;

  try {
    await handleCancellation(slotId, session.user.id);
    return NextResponse.json({ message: "Reservation cancelled" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
