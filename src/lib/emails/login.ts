/**
 * Login notification email templates (HTML + plain-text).
 *
 * Sent on every successful sign-in so users are alerted when
 * their account is accessed.
 *
 * Placeholders resolved at render time:
 *   {{first_name}}      – user's first name (parsed from full name)
 *   {{login_time}}      – formatted login timestamp
 *   {{support_email}}   – support@matchpoint.app
 *   {{company_address}} – physical mailing address (CAN-SPAM)
 *   {{unsubscribe_url}} – notification preferences / unsubscribe link
 */

// ── Subject line ─────────────────────────────────────────
export const DEFAULT_LOGIN_SUBJECT = "New sign-in to your MatchPoint account";

// ── Shared vars ──────────────────────────────────────────

const SUPPORT_EMAIL = "support@matchpoint.app";

// TODO: Replace with real physical address before production launch.
const COMPANY_ADDRESS_PLACEHOLDER = "MatchPoint HQ, South Bay, CA";

interface LoginTemplateVars {
  firstName: string;
  loginTime: string;
  unsubscribeUrl: string;
}

// ── Plain-text version ───────────────────────────────────

export function loginEmailText({
  firstName,
  loginTime,
  unsubscribeUrl,
}: LoginTemplateVars): string {
  return `Hi ${firstName},

We noticed a new sign-in to your MatchPoint account on ${loginTime}.

If this was you, no action is needed.

If you didn't sign in, please contact us immediately at ${SUPPORT_EMAIL} so we can secure your account.

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL} | ${COMPANY_ADDRESS_PLACEHOLDER}
Manage notifications: ${unsubscribeUrl}
`;
}

// ── HTML version ─────────────────────────────────────────

export function loginEmailHtml({
  firstName,
  loginTime,
  unsubscribeUrl,
}: LoginTemplateVars): string {
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

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We noticed a new sign-in to your MatchPoint account.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#f7f5f2;border-radius:8px;width:100%;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#717171;">Sign-in time</p>
                  <p style="margin:4px 0 0;font-size:16px;line-height:1.6;font-weight:600;">${loginTime}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">If this was you, no action is needed.</p>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">If you didn&rsquo;t sign in, please contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#3F6F5E;text-decoration:underline;">${SUPPORT_EMAIL}</a> so we can secure your account.</p>

            <p style="margin:0 0 4px;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>
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
