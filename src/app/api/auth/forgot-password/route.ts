import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "@/lib/emails/password-reset";
import { checkRateLimit, AUTH_LIMIT } from "@/lib/rate-limit";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(`forgot-password:${ip}`, AUTH_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    // Only send for users who signed up with credentials (have a passwordHash)
    if (!user || !user.passwordHash) {
      return successResponse;
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { expires: new Date(0) },
    });

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    const firstName = user.name?.split(" ")[0] || "there";
    const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your MatchPoint password",
      html: passwordResetEmailHtml({ firstName, resetUrl }),
      text: passwordResetEmailText({ firstName, resetUrl }),
    });

    return successResponse;
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
