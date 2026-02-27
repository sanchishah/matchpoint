import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { availabilityWindowSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windows = await prisma.availabilityWindow.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
  });

  return NextResponse.json(windows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = availabilityWindowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dayOfWeek, startHour, endHour } = parsed.data;

  // Check for duplicate
  const existing = await prisma.availabilityWindow.findUnique({
    where: {
      userId_dayOfWeek_startHour_endHour: {
        userId: session.user.id,
        dayOfWeek,
        startHour,
        endHour,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "This availability window already exists" }, { status: 409 });
  }

  const window = await prisma.availabilityWindow.create({
    data: {
      userId: session.user.id,
      dayOfWeek,
      startHour,
      endHour,
    },
  });

  return NextResponse.json(window, { status: 201 });
}
