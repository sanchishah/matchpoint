import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId } = await params;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      slot: true,
      participants: true,
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isParticipant = game.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const perPersonCents = Math.round(game.slot.totalCostCents / game.slot.requiredPlayers);

  // Check for existing payment
  const existingPayment = await prisma.payment.findUnique({
    where: { gameId_userId: { gameId, userId: session.user.id } },
  });

  if (existingPayment?.status === "SUCCEEDED") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  // If we have an existing PENDING payment with a PI, retrieve it
  if (existingPayment?.stripePaymentIntentId && existingPayment.status === "PENDING") {
    const existingPI = await stripe.paymentIntents.retrieve(
      existingPayment.stripePaymentIntentId
    );
    return NextResponse.json({
      paymentId: existingPayment.id,
      clientSecret: existingPI.client_secret,
      amountCents: perPersonCents,
      currency: "usd",
    });
  }

  // Create new PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: perPersonCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { gameId, userId: session.user.id },
    },
    { idempotencyKey: `game:${gameId}:user:${session.user.id}` }
  );

  // Upsert payment record
  const payment = await prisma.payment.upsert({
    where: { gameId_userId: { gameId, userId: session.user.id } },
    create: {
      gameId,
      userId: session.user.id,
      amountCents: perPersonCents,
      stripePaymentIntentId: paymentIntent.id,
      status: "PENDING",
    },
    update: {
      stripePaymentIntentId: paymentIntent.id,
      amountCents: perPersonCents,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    paymentId: payment.id,
    clientSecret: paymentIntent.client_secret,
    amountCents: perPersonCents,
    currency: "usd",
  });
}
