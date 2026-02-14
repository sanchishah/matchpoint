import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";
import { ADMIN_EMAILS } from "@/lib/constants";
import { sendWelcomeEmail } from "@/lib/welcome-email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const role = ADMIN_EMAILS.includes(email) ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: { email, name, passwordHash, role },
    });

    // Fire-and-forget: send welcome email without blocking the response.
    // sendWelcomeEmail handles its own error logging and idempotency.
    sendWelcomeEmail(user.id).catch(() => {
      // Errors already logged inside sendWelcomeEmail; this catch
      // prevents unhandled-rejection warnings.
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
