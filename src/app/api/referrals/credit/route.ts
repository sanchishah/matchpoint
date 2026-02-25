import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/referrals/credit
 * Called internally (from game-service or job runner) after a referee plays
 * their first game. Credits the referrer if an uncredited referral exists.
 *
 * Body: { userId: string }  — the referee's user ID
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Find an uncredited referral where this user is the referee
    const referral = await prisma.referral.findFirst({
      where: {
        refereeId: userId,
        credited: false,
      },
    });

    if (!referral) {
      return NextResponse.json({
        success: true,
        credited: false,
        message: "No uncredited referral found for this user",
      });
    }

    // Mark the referral as credited and increment the referrer's credits
    // Use a transaction to ensure atomicity
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: { credited: true },
      }),
      prisma.user.update({
        where: { id: referral.referrerId },
        data: {
          referralCredits: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      credited: true,
      referralId: referral.id,
      referrerId: referral.referrerId,
    });
  } catch (error) {
    console.error("POST /api/referrals/credit error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
