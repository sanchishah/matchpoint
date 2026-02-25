import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";
import { ADMIN_EMAILS } from "@/lib/constants";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import { sendEmail } from "@/lib/email";
import { verifyEmailHtml, verifyEmailText } from "@/lib/emails/verify-email";
import { checkRateLimit, AUTH_LIMIT } from "@/lib/rate-limit";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(`signup:${ip}`, AUTH_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const referralCode =
      typeof body.referralCode === "string"
        ? body.referralCode.trim()
        : undefined;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const role = ADMIN_EMAILS.includes(email) ? "ADMIN" : "USER";

    // Look up referrer before creating user so we can set referredByUserId
    let referrer: { id: string } | null = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        ...(referrer ? { referredByUserId: referrer.id } : {}),
      },
    });

    // Create the Referral record linking referrer and referee.
    // Credit is NOT applied here -- it happens when the referee plays
    // their first game (via /api/referrals/credit).
    if (referrer) {
      prisma.referral
        .create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
          },
        })
        .catch((err) => {
          // Log but don't block signup if referral record fails
          // (e.g. duplicate constraint if same pair already exists)
          console.error("Failed to create referral record:", err);
        });
    }

    // Fire-and-forget: send welcome email without blocking the response.
    // sendWelcomeEmail handles its own error logging and idempotency.
    sendWelcomeEmail(user.id).catch(() => {
      // Errors already logged inside sendWelcomeEmail; this catch
      // prevents unhandled-rejection warnings.
    });

    // Create verification token and send verification email (fire-and-forget).
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    prisma.verificationToken
      .create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: verificationExpires,
        },
      })
      .then(() => {
        const firstName = name?.split(" ")[0] || "there";
        const verifyUrl = `${APP_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

        return sendEmail({
          to: email,
          subject: "Verify your email address",
          html: verifyEmailHtml({ firstName, verifyUrl }),
          text: verifyEmailText({ firstName, verifyUrl }),
        });
      })
      .catch((err) => {
        console.error("[signup] Failed to send verification email:", err);
      });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
