import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { gameCancelledEmailHtml, gameCancelledEmailText, refundConfirmationEmailHtml, refundConfirmationEmailText } from "@/lib/emails/cancellation";
import { formatCents } from "@/lib/constants";
import { format } from "date-fns";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.startTime) {
    data.startTime = new Date(body.startTime);
    const lockTime = new Date(body.startTime);
    lockTime.setHours(lockTime.getHours() - 8);
    data.lockTime = lockTime;
  }

  const slot = await prisma.slot.update({ where: { id }, data });
  return NextResponse.json(slot);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const slot = await prisma.slot.findUnique({
    where: { id },
    include: {
      club: true,
      game: {
        include: {
          payments: {
            where: { status: "SUCCEEDED" },
            include: { user: { select: { email: true, name: true, profile: { select: { name: true } } } } },
          },
          participants: { include: { user: { select: { email: true, name: true, profile: { select: { name: true } } } } } },
        },
      },
      participants: {
        where: { status: { in: ["JOINED", "WAITLISTED"] } },
        include: { user: { select: { email: true, name: true, profile: { select: { name: true } } } } },
      },
    },
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  // Cancel the slot
  await prisma.slot.update({ where: { id }, data: { status: "CANCELLED" } });

  // Cancel the game if exists
  if (slot.game) {
    await prisma.game.update({ where: { id: slot.game.id }, data: { status: "CANCELLED" } });

    // Auto-refund all succeeded payments
    for (const payment of slot.game.payments) {
      if (payment.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });

          // Send refund email
          const firstName = payment.user.profile?.name?.split(" ")[0] || payment.user.name?.split(" ")[0] || "there";
          sendEmail({
            to: payment.user.email,
            subject: `Refund processed — ${formatCents(payment.amountCents)}`,
            html: refundConfirmationEmailHtml({ firstName, clubName: slot.club.name, amount: formatCents(payment.amountCents) }),
            text: refundConfirmationEmailText({ firstName, clubName: slot.club.name, amount: formatCents(payment.amountCents) }),
          }).catch(() => {});
        } catch (error) {
          console.error(`Refund failed for payment ${payment.id}:`, error);
        }
      }
    }

    // Send cancellation emails to all game participants
    const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
    for (const p of slot.game.participants) {
      const firstName = p.user.profile?.name?.split(" ")[0] || p.user.name?.split(" ")[0] || "there";
      sendEmail({
        to: p.user.email,
        subject: "Game cancelled",
        html: gameCancelledEmailHtml({ firstName, clubName: slot.club.name, dateStr }),
        text: gameCancelledEmailText({ firstName, clubName: slot.club.name, dateStr }),
      }).catch(() => {});
    }
  } else {
    // No game yet — notify slot participants
    const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
    for (const p of slot.participants) {
      const firstName = p.user.profile?.name?.split(" ")[0] || p.user.name?.split(" ")[0] || "there";
      sendEmail({
        to: p.user.email,
        subject: "Game cancelled",
        html: gameCancelledEmailHtml({ firstName, clubName: slot.club.name, dateStr }),
        text: gameCancelledEmailText({ firstName, clubName: slot.club.name, dateStr }),
      }).catch(() => {});
    }
  }

  // Cancel all slot participants
  await prisma.slotParticipant.updateMany({
    where: { slotId: id, status: { in: ["JOINED", "WAITLISTED"] } },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
