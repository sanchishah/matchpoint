/**
 * Welcome email templates (HTML + plain-text).
 *
 * Placeholders resolved at render time:
 *   {{first_name}}      – user's first name (parsed from full name)
 *   {{profile_url}}     – link to profile/onboarding page
 *   {{support_email}}   – support@matchpoint.app
 *   {{company_address}} – physical mailing address (CAN-SPAM)
 *   {{unsubscribe_url}} – notification preferences / unsubscribe link
 */

// ── Subject lines ────────────────────────────────────────
// Default is index 0. Alternates kept for A/B testing later.
export const WELCOME_SUBJECTS = [
  "You've officially entered the kitchen \u{1F3BE}",
  "Let's get you out of open play purgatory",
  "Your paddle called. It's game time.",
] as const;

export const DEFAULT_WELCOME_SUBJECT = WELCOME_SUBJECTS[0];

// ── Shared vars ──────────────────────────────────────────

const SUPPORT_EMAIL = "support@matchpoint.app";

// TODO: Replace with real physical address before production launch.
const COMPANY_ADDRESS_PLACEHOLDER = "MatchPoint HQ, South Bay, CA";

interface WelcomeTemplateVars {
  firstName: string;
  profileUrl: string;
  unsubscribeUrl: string;
}

// ── Plain-text version ───────────────────────────────────

export function welcomeEmailText({
  firstName,
  profileUrl,
  unsubscribeUrl,
}: WelcomeTemplateVars): string {
  return `Hi ${firstName},

You did it. You created a MatchPoint account.

Which means two things:
1. You're serious about playing.
2. You're officially done with chaotic open play and mystery skill levels.

At MatchPoint, we match players by:
- Skill level
- Age bracket
- Location

So you're not stuck explaining what a third-shot drop is... or defending against someone who thinks it's tennis.

Here's your next move:
- Complete your profile (2 minutes, max): ${profileUrl}
- Choose your skill level -- Beginner, Intermediate, or Advanced
- Check out upcoming South Bay sessions

We pre-book the courts.
You just show up, warm up, and start dinking.

As you play more sessions, your level naturally gets refined -- so future games feel balanced and fun.

Because great games are built before the first serve.

See you on court,
The MatchPoint Team

P.S. Side effects may include longer rallies and new group chats.

---
${SUPPORT_EMAIL} | ${COMPANY_ADDRESS_PLACEHOLDER}
Manage notifications: ${unsubscribeUrl}
`;
}

// ── HTML version ─────────────────────────────────────────

export function welcomeEmailHtml({
  firstName,
  profileUrl,
  unsubscribeUrl,
}: WelcomeTemplateVars): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f7f5f2;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#4A4A4A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#3F6F5E;padding:32px 32px 24px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#ffffff;font-weight:700;">MatchPoint</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">You did it. You created a MatchPoint account.</p>

            <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">Which means two things:</p>
            <ol style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.8;">
              <li>You&rsquo;re serious about playing.</li>
              <li>You&rsquo;re officially done with chaotic open play and mystery skill levels.</li>
            </ol>

            <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">At MatchPoint, we match players by:</p>
            <ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.8;">
              <li>Skill level</li>
              <li>Age bracket</li>
              <li>Location</li>
            </ul>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">So you&rsquo;re not stuck explaining what a third-shot drop is&hellip; or defending against someone who thinks it&rsquo;s tennis.</p>

            <p style="margin:0 0 12px;font-size:16px;line-height:1.6;font-weight:600;">Here&rsquo;s your next move:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td style="padding:4px 0;font-size:16px;line-height:1.6;">\u{1F3BE}&nbsp; Complete your profile (2 minutes, max)</td></tr>
              <tr><td style="padding:4px 0;font-size:16px;line-height:1.6;">\u{1F3BE}&nbsp; Choose your skill level &mdash; Beginner, Intermediate, or Advanced</td></tr>
              <tr><td style="padding:4px 0;font-size:16px;line-height:1.6;">\u{1F3BE}&nbsp; Check out upcoming South Bay sessions</td></tr>
            </table>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td align="center" style="background-color:#3F6F5E;border-radius:8px;">
                  <a href="${profileUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Complete Your Profile</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We pre-book the courts.<br>You just show up, warm up, and start dinking.</p>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">As you play more sessions, your level naturally gets refined &mdash; so future games feel balanced and fun.</p>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;font-style:italic;">Because great games are built before the first serve.</p>

            <p style="margin:0 0 4px;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>

            <p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#717171;">P.S. Side effects may include longer rallies and new group chats.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
            <p style="margin:0 0 6px;font-size:12px;color:#999999;line-height:1.5;">
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#717171;text-decoration:none;">${SUPPORT_EMAIL}</a>
              &nbsp;&middot;&nbsp; ${COMPANY_ADDRESS_PLACEHOLDER}
            </p>
            <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
              <a href="${unsubscribeUrl}" style="color:#717171;text-decoration:underline;">Manage notification preferences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
