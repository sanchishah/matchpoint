import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.APP_BASE_URL || "https://www.mymatchpoint.com";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/login?error=missing-token`);
    }

    // Look up the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(`${BASE_URL}/login?error=invalid-token`);
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      // Clean up the expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return NextResponse.redirect(`${BASE_URL}/login?error=expired-token`);
    }

    // Mark the user's email as verified
    await prisma.user.updateMany({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.redirect(`${BASE_URL}/login?verified=true`);
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.redirect(
      `${BASE_URL}/login?error=verification-failed`
    );
  }
}
