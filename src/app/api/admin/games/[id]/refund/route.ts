import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: gameId } = await params;
  const { userId } = await req.json();

  const payment = await prisma.payment.findFirst({
    where: { gameId, userId, status: "SUCCEEDED" },
  });

  if (!payment || !payment.stripePaymentIntentId) {
    return NextResponse.json({ error: "No payment found to refund" }, { status: 400 });
  }

  try {
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refund failed:", error);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
