import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { refundConfirmationEmailHtml, refundConfirmationEmailText } from "@/lib/emails/cancellation";
import { formatCents } from "@/lib/constants";

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
    include: {
      user: { select: { email: true, name: true, profile: { select: { name: true } } } },
      game: { include: { slot: { include: { club: true } } } },
    },
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

    // Send refund confirmation email
    const firstName = payment.user.profile?.name?.split(" ")[0] || payment.user.name?.split(" ")[0] || "there";
    const amount = formatCents(payment.amountCents);
    const clubName = payment.game.slot.club.name;

    sendEmail({
      to: payment.user.email,
      subject: `Refund processed — ${amount}`,
      html: refundConfirmationEmailHtml({ firstName, clubName, amount }),
      text: refundConfirmationEmailText({ firstName, clubName, amount }),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refund failed:", error);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
