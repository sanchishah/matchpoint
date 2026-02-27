import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const window = await prisma.availabilityWindow.findUnique({
    where: { id },
  });

  if (!window) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (window.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.availabilityWindow.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
