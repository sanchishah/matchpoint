import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendEmail, gameConfirmedEmail } from "@/lib/email";
import { formatCents } from "@/lib/constants";
import { format } from "date-fns";

export async function confirmGame(slotId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      club: true,
      participants: {
        where: { status: "JOINED" },
        include: { user: { include: { profile: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!slot) throw new Error("Slot not found");

  const joinedCount = slot.participants.length;
  if (joinedCount < slot.requiredPlayers) return null;

  const perPersonCents = Math.round(slot.totalCostCents / slot.requiredPlayers);
  const endTime = new Date(slot.startTime);
  endTime.setMinutes(endTime.getMinutes() + slot.durationMins);

  // Create game
  const game = await prisma.game.create({
    data: {
      slotId: slot.id,
      clubId: slot.clubId,
      startTime: slot.startTime,
      endTime,
      status: "CONFIRMED",
    },
  });

  const confirmedParticipants: string[] = [];

  for (const participant of slot.participants) {
    try {
      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: perPersonCents,
        currency: "usd",
        confirm: true,
        payment_method: "pm_card_visa",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          gameId: game.id,
          slotId: slot.id,
          userId: participant.userId,
        },
      });

      // Record payment
      await prisma.payment.create({
        data: {
          gameId: game.id,
          userId: participant.userId,
          amountCents: perPersonCents,
          stripePaymentIntentId: paymentIntent.id,
          status: "SUCCEEDED",
        },
      });

      // Add as game participant
      await prisma.gameParticipant.create({
        data: { gameId: game.id, userId: participant.userId },
      });

      confirmedParticipants.push(participant.userId);

      // Send confirmation email
      const dateStr = format(slot.startTime, "EEEE, MMM d 'at' h:mm a");
      const emailData = gameConfirmedEmail(
        participant.user.profile?.name || participant.user.name || "Player",
        slot.club.name,
        dateStr,
        formatCents(perPersonCents)
      );
      sendEmail({ to: participant.user.email, ...emailData });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          type: "GAME_CONFIRMED",
          title: "Game Confirmed!",
          body: `Your game at ${slot.club.name} on ${dateStr} is confirmed. ${formatCents(perPersonCents)} has been charged.`,
        },
      });
    } catch (error) {
      console.error(`Payment failed for user ${participant.userId}:`, error);

      // Mark participant as payment failed
      await prisma.slotParticipant.update({
        where: { id: participant.id },
        data: { status: "PAYMENT_FAILED" },
      });

      // Try to pull from waitlist
      const waitlisted = await prisma.slotParticipant.findFirst({
        where: {
          slotId: slot.id,
          status: "WAITLISTED",
        },
        include: { user: { include: { profile: true } } },
        orderBy: { joinedAt: "asc" },
      });

      if (waitlisted && waitlisted.user.profile) {
        // Check matching rules
        if (
          waitlisted.user.profile.skillLevel === slot.skillLevel &&
          waitlisted.user.profile.ageBracket === slot.ageBracket
        ) {
          await prisma.slotParticipant.update({
            where: { id: waitlisted.id },
            data: { status: "JOINED" },
          });
          // Recursively retry would be complex; for MVP, log it
          console.log(`Promoted waitlisted user ${waitlisted.userId} for slot ${slotId}`);
        }
      }
    }
  }

  // Update slot status
  if (confirmedParticipants.length >= slot.requiredPlayers) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { status: "CONFIRMED" },
    });
  }

  return game;
}

export async function handleCancellation(slotId: string, userId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { club: true },
  });

  if (!slot) throw new Error("Slot not found");

  const now = new Date();
  if (now >= slot.lockTime) {
    throw new Error("Cannot cancel after lock time. Please contact admin.");
  }

  // Cancel participation
  await prisma.slotParticipant.updateMany({
    where: { slotId, userId, status: { in: ["JOINED", "WAITLISTED"] } },
    data: { status: "CANCELLED" },
  });

  // Try to replace from waitlist
  const waitlisted = await prisma.slotParticipant.findFirst({
    where: {
      slotId,
      status: "WAITLISTED",
    },
    include: { user: { include: { profile: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (waitlisted && waitlisted.user.profile) {
    if (
      waitlisted.user.profile.skillLevel === slot.skillLevel &&
      waitlisted.user.profile.ageBracket === slot.ageBracket
    ) {
      await prisma.slotParticipant.update({
        where: { id: waitlisted.id },
        data: { status: "JOINED" },
      });

      await prisma.notification.create({
        data: {
          userId: waitlisted.userId,
          type: "PROMOTED_FROM_WAITLIST",
          title: "You're in!",
          body: `A spot opened up at ${slot.club.name}. You've been moved from the waitlist.`,
        },
      });
    }
  }

  // Re-check joined count
  const joinedCount = await prisma.slotParticipant.count({
    where: { slotId, status: "JOINED" },
  });

  if (joinedCount === 0) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { status: "OPEN" },
    });
  } else if (joinedCount < slot.requiredPlayers) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { status: "PENDING_FILL" },
    });
  }
}
