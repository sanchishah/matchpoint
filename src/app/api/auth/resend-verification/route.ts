import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { verifyEmailHtml, verifyEmailText } from "@/lib/emails/verify-email";
import { checkRateLimit, AUTH_LIMIT } from "@/lib/rate-limit";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit by user ID
    const { allowed } = checkRateLimit(
      `resend-verification:${userId}`,
      AUTH_LIMIT
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Fetch the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already verified — return early
    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified.",
        alreadyVerified: true,
      });
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Create a new verification token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // Send verification email
    const firstName = user.name?.split(" ")[0] || "there";
    const verifyUrl = `${APP_BASE_URL}/api/auth/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: verifyEmailHtml({ firstName, verifyUrl }),
      text: verifyEmailText({ firstName, verifyUrl }),
    });

    return NextResponse.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("[resend-verification] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
