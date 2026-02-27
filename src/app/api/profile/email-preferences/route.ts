import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { emailPreferenceSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pref = await prisma.emailPreference.findUnique({
    where: { userId: session.user.id },
  });

  // Return defaults if no preference record exists
  return NextResponse.json(
    pref || {
      gameConfirmations: true,
      reminders: true,
      chatNotifications: true,
      marketing: true,
      referralUpdates: true,
      friendRequests: true,
      availabilityMatches: true,
    }
  );
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = emailPreferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pref = await prisma.emailPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json(pref);
}
