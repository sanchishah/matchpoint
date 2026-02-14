import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  DEFAULT_WELCOME_SUBJECT,
  welcomeEmailHtml,
  welcomeEmailText,
} from "@/lib/emails/welcome";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

/**
 * Send the welcome email for a newly created user.
 *
 * Idempotency: uses an atomic `updateMany` with a WHERE guard on
 * `welcomeEmailSentAt IS NULL` so only the first caller wins — even
 * under concurrent retries or duplicate webhook deliveries.
 *
 * This function never throws. Failures are logged and the signup flow
 * continues unblocked.
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    // Atomically claim the send: only update if welcomeEmailSentAt is still null.
    // updateMany returns a count — if 0, another process already claimed it.
    const result = await prisma.user.updateMany({
      where: { id: userId, welcomeEmailSentAt: null },
      data: { welcomeEmailSentAt: new Date() },
    });

    if (result.count === 0) {
      console.log(`[welcome-email] Already sent for user ${userId}, skipping.`);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.error(`[welcome-email] User ${userId} not found after update.`);
      return;
    }

    const firstName = user.name?.split(" ")[0] || "there";
    const profileUrl = `${APP_BASE_URL}/profile/setup`;
    // TODO: Implement real unsubscribe endpoint. For now, link to profile settings.
    const unsubscribeUrl = `${APP_BASE_URL}/profile/setup`;

    const html = welcomeEmailHtml({ firstName, profileUrl, unsubscribeUrl });
    const text = welcomeEmailText({ firstName, profileUrl, unsubscribeUrl });

    await sendEmail({
      to: user.email,
      subject: DEFAULT_WELCOME_SUBJECT,
      html,
      text,
    });

    console.log(`[welcome-email] Sent to ${user.email} (user ${userId}).`);
  } catch (error) {
    // Never block signup — log and move on.
    console.error(`[welcome-email] Failed for user ${userId}:`, error);

    // Best-effort rollback so a future retry can attempt again.
    try {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { welcomeEmailSentAt: null },
      });
    } catch {
      // If even the rollback fails, we accept the flag stays set.
      // A manual DB fix or admin re-trigger can resolve this edge case.
      console.error(`[welcome-email] Rollback also failed for user ${userId}.`);
    }
  }
}
