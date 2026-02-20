import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validations";
import { checkRateLimit, CONTACT_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(`contact:${ip}`, CONTACT_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: parsed.data,
    });

    return NextResponse.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("[contact] DB error:", err);
    return NextResponse.json(
      { error: "Failed to send message", debug: String(err) },
      { status: 500 }
    );
  }
}
