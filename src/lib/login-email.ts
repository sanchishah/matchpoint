import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  DEFAULT_LOGIN_SUBJECT,
  loginEmailHtml,
  loginEmailText,
} from "@/lib/emails/login";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

/**
 * Send a login notification email for a sign-in event.
 *
 * Unlike the welcome email, no idempotency guard is needed —
 * every successful sign-in should trigger a notification.
 *
 * This function never throws. Failures are logged and the login
 * flow continues unblocked.
 */
export async function sendLoginEmail(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.error(`[login-email] User ${userId} not found.`);
      return;
    }

    const firstName = user.name?.split(" ")[0] || "there";
    const loginTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    // TODO: Implement real unsubscribe endpoint. For now, link to profile settings.
    const unsubscribeUrl = `${APP_BASE_URL}/profile/setup`;

    const html = loginEmailHtml({ firstName, loginTime, unsubscribeUrl });
    const text = loginEmailText({ firstName, loginTime, unsubscribeUrl });

    await sendEmail({
      to: user.email,
      subject: DEFAULT_LOGIN_SUBJECT,
      html,
      text,
    });

    console.log(`[login-email] Sent to ${user.email} (user ${userId}).`);
  } catch (error) {
    // Never block login — log and move on.
    console.error(`[login-email] Failed for user ${userId}:`, error);
  }
}
