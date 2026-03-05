import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || "(not set, using default)",
    APP_BASE_URL: process.env.APP_BASE_URL || "(not set, using default)",
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  });
}
