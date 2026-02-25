import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const REFERRAL_LIMIT = { maxRequests: 10, windowMs: 60 * 1_000 };

/**
 * GET /api/referrals
 * Requires auth. Returns the user's referral code, credits, and referral list.
 * If the user has no referral code yet, generates one.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCredits: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a referral code if the user doesn't have one yet
    if (!user.referralCode) {
      const code = generateReferralCode();
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: {
          referralCode: true,
          referralCredits: true,
        },
      });
    }

    // Fetch referrals given by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      select: {
        createdAt: true,
        credited: true,
        referee: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const maskedReferrals = referrals.map((r) => ({
      refereeEmail: maskEmail(r.referee.email),
      createdAt: r.createdAt,
      credited: r.credited,
    }));

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCredits: user.referralCredits,
      referrals: maskedReferrals,
    });
  } catch (error) {
    console.error("GET /api/referrals error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals
 * Public. Validates a referral code and returns the referrer's first name.
 * Body: { code: string }
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(`referral-validate:${ip}`, REFERRAL_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.trim() },
      select: { name: true },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Return only the first name for privacy
    const firstName = referrer.name?.split(" ")[0] || "A friend";

    return NextResponse.json({
      valid: true,
      referrerName: firstName,
    });
  } catch (error) {
    console.error("POST /api/referrals error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────

function generateReferralCode(): string {
  // 8-character alphanumeric code from random bytes
  return randomBytes(6)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visibleChars = Math.min(2, local.length);
  const masked = local.slice(0, visibleChars) + "***";
  return `${masked}@${domain}`;
}
